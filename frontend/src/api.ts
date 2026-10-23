import { callHouseholdTool, setMcpSession, toolForAction } from "./mcp-client";
let csrf = "";
export function setCsrf(value?: string) {
  csrf = value ?? "";
  setMcpSession(csrf);
}
export class ApiError extends Error {
  status: number;
  requestId?: string;
  constructor(message: string, status: number, requestId?: string) {
    super(message);
    this.status = status;
    this.requestId = requestId;
  }
}
export async function api<T = any>(
  path: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
): Promise<T> {
  if (path === "state" && csrf)
    return (await callHouseholdTool("readyby_get_mission", {})) as T;
  if (path === "command") {
    const prepared = await callHouseholdTool(
      "readyby_interpret_request",
      body as Record<string, unknown>,
    );
    if (prepared.result) return prepared.result as T;
    return (await callHouseholdTool(
      prepared.toolName,
      prepared.arguments,
    )) as T;
  }
  if (path === "action") {
    const { type, ...args } = body as Record<string, unknown>;
    const tool = toolForAction[String(type)];
    if (!tool) throw new ApiError("Unknown household action.", 400);
    if (type === "approve") {
      const confirmation = await api<{ confirmationToken: string }>(
        "proposals/confirm",
        args,
      );
      args.confirmationToken = confirmation.confirmationToken;
    }
    return (await callHouseholdTool(tool, args)) as T;
  }
  if (path === "missions" && body && typeof body === "object")
    body = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...body,
    };
  const response = await fetch("/api/" + path, {
    method,
    credentials: "same-origin",
    headers: {
      ...(body === undefined
        ? {}
        : { "Content-Type": "application/json", "X-CSRF-Token": csrf }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      "ReadyBy is temporarily unreachable. Please try again.",
      response.status,
    );
  }
  if (!response.ok)
    throw new ApiError(
      data.error || "The request failed.",
      response.status,
      data.requestId,
    );
  if (data.csrfToken) setCsrf(data.csrfToken);
  return data;
}
export function requestKey() {
  return crypto.randomUUID();
}
