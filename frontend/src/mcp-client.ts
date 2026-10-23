import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

let csrf = "",
  connection: Promise<Client> | null = null;
const status = {
  protocol: "",
  connected: false,
  toolCount: 0,
  trace: [] as {
    method: string;
    tool?: string;
    status: number;
    latencyMs: number;
    automaticRead?: boolean;
  }[],
};
export const getMcpStatus = () => ({ ...status, trace: [...status.trace] });
export function setMcpSession(value: string) {
  if (value === csrf) return;
  csrf = value;
  const old = connection;
  connection = null;
  status.connected = false;
  status.protocol = "";
  status.toolCount = 0;
  status.trace = [];
  if (old) void old.then((c) => c.close()).catch(() => {});
}
async function connect() {
  if (!connection)
    connection = (async () => {
      const [{ Client }, { StreamableHTTPClientTransport }] = await Promise.all(
        [
          import("@modelcontextprotocol/sdk/client/index.js"),
          import("@modelcontextprotocol/sdk/client/streamableHttp.js"),
        ],
      );
      const client = new Client({
        name: "readyby-household-web",
        version: "0.4.0",
      });
      const transport = new StreamableHTTPClientTransport(
        new URL("/mcp", location.origin),
        {
          requestInit: { credentials: "same-origin" },
          fetch: async (input, init) => {
            const headers = new Headers(init?.headers);
            headers.set("X-CSRF-Token", csrf);
            const started = performance.now();
            const message =
              typeof init?.body === "string" ? JSON.parse(init.body) : null;
            const response = await fetch(input, {
              ...init,
              headers,
              credentials: "same-origin",
            });
            if (message) {
              status.trace.push({
                method: message.method,
                tool: message.params?.name,
                status: response.status,
                latencyMs: Math.round(performance.now() - started),
                automaticRead:
                  message.method === "tools/call" &&
                  message.params?.name === "readyby_get_mission" &&
                  !message.params?.arguments?.preparedToken,
              });
              const handshake = status.trace.filter((r) =>
                [
                  "initialize",
                  "notifications/initialized",
                  "tools/list",
                ].includes(r.method),
              );
              const activity = status.trace
                .filter((r) => !r.automaticRead && !handshake.includes(r))
                .slice(-10);
              const reads = status.trace
                .filter((r) => r.automaticRead)
                .slice(-3);
              status.trace = status.trace.filter(
                (r) =>
                  handshake.includes(r) ||
                  activity.includes(r) ||
                  reads.includes(r),
              );
              if (message.method === "initialize" && response.ok) {
                const data = await response.clone().json();
                status.protocol = data.result?.protocolVersion || "";
              }
            }
            return response;
          },
        },
      );
      await client.connect(transport);
      const tools = await client.listTools();
      status.toolCount = tools.tools.length;
      status.connected = true;
      return client;
    })().catch((e) => {
      connection = null;
      status.connected = false;
      throw e;
    });
  return connection;
}
export async function callHouseholdTool(
  name: string,
  args: Record<string, unknown>,
) {
  try {
    const client = await connect();
    const result = await client.callTool({ name, arguments: args });
    const data = (result.structuredContent ??
      JSON.parse(
        (result.content as { type: string; text?: string }[]).find(
          (c) => c.type === "text",
        )?.text || "{}",
      )) as Record<string, any>;
    if (result.isError) {
      const httpStatus =
        (
          {
            STALE_REVISION: 409,
            CONFIRMATION_REQUIRED: 409,
            FORBIDDEN: 403,
            UNAUTHORIZED: 401,
            RATE_LIMIT: 429,
          } as Record<string, number>
        )[data.code] || 400;
      throw Object.assign(
        new Error(data.error || "The household tool failed."),
        { status: httpStatus },
      );
    }
    return data;
  } catch (e) {
    if (e instanceof Error && "status" in e) throw e;
    throw Object.assign(
      new Error(
        "MCP connection failed. Your saved plan is retained. Refresh and retry.",
      ),
      { status: 503 },
    );
  }
}
export const toolForAction: Record<string, string> = {
  progress: "readyby_report_progress",
  delay: "readyby_report_delay",
  edit_task: "readyby_edit_task",
  availability: "readyby_set_availability",
  recalculate: "readyby_recalculate",
  approve: "readyby_commit_proposal",
  reject: "readyby_reject_proposal",
  start_mission: "readyby_start_mission",
  draft_mission: "readyby_draft_mission",
  clock: "readyby_advance_demo",
  resume_deferred: "readyby_resume_deferred",
};
