import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

export const MCP_VERSION = "2025-11-25";
const id = z.string().min(1).max(120);
const base = {
  missionId: id,
  expectedRevision: z.number().int().nonnegative(),
  idempotencyKey: z.string().min(4).max(120),
  preparedToken: z.string().optional(),
};
const task = z
  .object({
    id,
    title: z.string().min(1).max(100),
    duration: z.number().int().min(1).max(90),
    owner: id,
    deps: z.array(id),
    required: z.boolean(),
    waitMinutes: z.number().int().min(0).max(180).optional(),
    barrier: z.boolean().optional(),
  })
  .strict();
const definitions = [
  [
    "readyby_get_mission",
    "Inspect a household mission and its checked schedule. Prepared status/clarification requests are recorded without changing commitments.",
    {
      missionId: id.optional(),
      expectedRevision: base.expectedRevision.optional(),
      idempotencyKey: base.idempotencyKey.optional(),
      preparedToken: base.preparedToken,
    },
    true,
  ],
  [
    "readyby_report_progress",
    "Record only the household's explicit report of starting, pausing, resuming or completing a task. Elapsed time is never completion.",
    {
      ...base,
      taskId: id,
      operation: z.enum(["start", "complete", "pause", "resume"]),
      remainingMinutes: z.number().int().min(1).max(90).optional(),
    },
  ],
  [
    "readyby_report_delay",
    "Update an explicitly reported passive wait or remaining work estimate. Returns checked recovery proposals; never auto-defers work.",
    {
      ...base,
      taskId: id,
      minutes: z.number().int().min(0).max(120),
      kind: z.enum(["release", "remaining"]).optional(),
    },
  ],
  [
    "readyby_edit_task",
    "Update a pending task constraint. Essential work must remain protected during recovery.",
    {
      ...base,
      taskId: id,
      field: z.enum(["duration", "required", "owner", "release"]),
      value: z.union([z.string(), z.number(), z.boolean()]),
    },
  ],
  [
    "readyby_set_availability",
    "Record an adult's explicitly reported absence and recalculate capacity.",
    { ...base, personId: id, minutes: z.number().int().min(1).max(120) },
  ],
  [
    "readyby_recalculate",
    "Compute and independently check recovery proposals against current state. Does not approve a trade-off.",
    { ...base },
  ],
  [
    "readyby_commit_proposal",
    "Apply one exact reviewed proposal. Requires a short-lived confirmation token from the authenticated review interface; a model cannot create one through MCP.",
    { ...base, proposalId: id, confirmationToken: z.string().min(1) },
  ],
  [
    "readyby_reject_proposal",
    "Reject proposed trade-offs while keeping reported disruption and completed progress.",
    { ...base },
  ],
  [
    "readyby_start_mission",
    "Start a draft after the household reviews its estimates.",
    { ...base },
  ],
  [
    "readyby_draft_mission",
    "Create or revise a reviewable draft, using estimates rather than pretending chores happened.",
    {
      ...base,
      deadline: z.number().int().optional(),
      tasks: z.array(task).max(8).optional(),
    },
  ],
  [
    "readyby_advance_demo",
    "Advance an explicitly labelled demo clock; never completes work automatically.",
    { ...base, minute: z.number().int() },
  ],
  [
    "readyby_resume_deferred",
    "Resume saved work only after readiness is explicitly confirmed with a new deadline.",
    {
      ...base,
      taskId: id,
      readyConfirmed: z.boolean(),
      deadline: z.number().int(),
    },
  ],
];

export const MCP_TOOL_NAMES = [
  "readyby_interpret_request",
  ...definitions.map((d) => d[0]),
];

export async function handleMcp(req, res, body, { identity, service }) {
  if (req.method !== "POST") {
    res.writeHead(405, { Allow: "POST" });
    res.end();
    return;
  }
  const server = new McpServer(
    { name: "readyby-household-recovery", version: "0.4.0" },
    {
      instructions:
        "Household deadline recovery. All tools are scoped to the authenticated household. Inspect state, use explicit progress reports and review consequential proposals. Native Alexa connectivity is not configured.",
    },
  );
  function register(name, description, fields, callback, readOnlyHint = false) {
    server.registerTool(
      name,
      {
        description,
        inputSchema: z.object(fields).strict(),
        annotations: {
          readOnlyHint,
          destructiveHint: !readOnlyHint,
          openWorldHint: false,
          idempotentHint: name !== "readyby_interpret_request",
        },
      },
      async (args) => {
        try {
          const result = await callback(args);
          return {
            content: [{ type: "text", text: JSON.stringify(result) }],
            structuredContent: result,
          };
        } catch (e) {
          const error = {
            error:
              e.name === "DomainError"
                ? e.message
                : "The household request could not be completed.",
            code: e.code || "INTERNAL",
          };
          return {
            isError: true,
            content: [{ type: "text", text: JSON.stringify(error) }],
            structuredContent: error,
          };
        }
      },
    );
  }
  register(
    "readyby_interpret_request",
    "Interpret household language using the configured real model, or a bounded clarification rule. Returns a short-lived prepared call to a specific household tool. Does not apply that action or approve a commitment.",
    {
      missionId: id,
      expectedRevision: base.expectedRevision,
      idempotencyKey: base.idempotencyKey,
      text: z.string().min(1).max(2000),
    },
    (args) => service.prepare(identity, args),
  );
  for (const [name, description, fields, readOnly] of definitions)
    register(
      name,
      description,
      fields,
      (args) =>
        service.call(identity, name, args, {
          protocol: MCP_VERSION,
          transport: "Streamable HTTP",
          method: "tools/call",
          tool: name,
          requestId: String(body?.id ?? ""),
          at: new Date().toISOString(),
        }),
      readOnly,
    );
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on("close", () => {
    void transport.close();
    void server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, body);
}
