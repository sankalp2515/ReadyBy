import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const base = process.env.READYBY_SERVER || "http://127.0.0.1:4173";
const u = new URL(base);
assert.ok(
  ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname),
  "This demo is restricted to a loopback server.",
);
const live = process.argv.includes("--live"),
  trace = [],
  receipts = [];
let cookie = "",
  csrf = "";
async function http(path, body) {
  const response = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      "X-CSRF-Token": csrf,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  assert.equal(
    response.status,
    200,
    `${path}: ${data.error || response.status}`,
  );
  if (response.headers.has("set-cookie"))
    cookie = response.headers.get("set-cookie").split(";")[0];
  if (data.csrfToken) csrf = data.csrfToken;
  return data;
}
await http("/api/auth/demo", {});
const client = new Client({
  name: "readyby-independent-cli",
  version: "0.4.0",
});
let negotiated = "";
const transport = new StreamableHTTPClientTransport(new URL(base + "/mcp"), {
  requestInit: { headers: { Cookie: cookie, "X-CSRF-Token": csrf } },
  fetch: async (url, options) => {
    const started = Date.now(),
      message =
        typeof options?.body === "string" ? JSON.parse(options.body) : null;
    const response = await fetch(url, options);
    if (message) {
      trace.push({
        method: message.method,
        tool: message.params?.name,
        status: response.status,
        latencyMs: Date.now() - started,
      });
      if (message.method === "initialize" && response.ok)
        negotiated = (await response.clone().json()).result.protocolVersion;
    }
    return response;
  },
});
await client.connect(transport);
const call = async (name, args = {}) => {
  const r = await client.callTool({ name, arguments: args });
  const d = r.structuredContent || JSON.parse(r.content[0].text);
  assert.ok(!r.isError, `${name}: ${d.error}`);
  return d;
};
const write = (s, args = {}) => ({
  missionId: s.id,
  expectedRevision: s.revision,
  idempotencyKey: randomUUID(),
  ...args,
});
try {
  const tools = await client.listTools();
  let s = (await call("readyby_get_mission")).state;
  const openingFinish = s.analysis.full.finish;
  s = (await http("/api/demo/scenario", write(s, { scenario: "delay" }))).state;
  async function command(text) {
    const p = await call("readyby_interpret_request", write(s, { text }));
    const r = p.result || (await call(p.toolName, p.arguments));
    s = r.state;
    receipts.push(s.receipts.at(-1));
    return r;
  }
  if (live) {
    await command("The washer needs more time.");
    assert.ok(s.pendingClarification);
    await command("fifteen minutes");
  } else
    s = (
      await call(
        "readyby_report_delay",
        write(s, { taskId: "laundry", minutes: 15, kind: "release" }),
      )
    ).state;
  assert.equal(s.analysis.full.finish, 508);
  const option = s.proposal.options.find((o) => o.kind === "defer");
  assert.equal(option.finish, 496);
  assert.equal(s.tasks.find((t) => t.id === "laundry").status, "pending");
  if (live) {
    const r = await command("Yes, save laundry for later.");
    assert.equal(r.reviewProposalId, option.id);
    assert.equal(s.tasks.find((t) => t.id === "laundry").status, "pending");
  }
  // Scripted confirmation exercises the dedicated UI boundary; it is not evidence of a human approving.
  const confirmation = await http("/api/proposals/confirm", {
    missionId: s.id,
    expectedRevision: s.revision,
    proposalId: option.id,
  });
  s = (
    await call(
      "readyby_commit_proposal",
      write(s, {
        proposalId: option.id,
        confirmationToken: confirmation.confirmationToken,
      }),
    )
  ).state;
  assert.equal(s.tasks.find((t) => t.id === "laundry").status, "deferred");
  assert.equal(s.deadline, 500);
  receipts.push(s.receipts.at(-1));
  assert.ok(!JSON.stringify(s).includes(confirmation.confirmationToken));
  const approvedMissionId = s.id;
  s = (await http("/api/demo/scenario", write(s, { scenario: "essential" })))
    .state;
  s = (
    await call(
      "readyby_report_delay",
      write(s, { taskId: "laundry", minutes: 15 }),
    )
  ).state;
  assert.ok(!s.proposal.options.some((o) => o.kind === "defer"));
  const report = {
    at: new Date().toISOString(),
    scope: live
      ? "Independent official SDK client; actual hosted interpretation and bounded follow-up; scripted fixture/confirmation, not a human voice demo"
      : "Independent official SDK client; direct typed tools, no LLM call; scripted fixture/confirmation",
    negotiatedProtocol: negotiated,
    discoveredTools: tools.tools.map((t) => t.name),
    openingFinish,
    disruptedFinish: 508,
    retainedWorkFinish: 496,
    approvedMissionId,
    essentialDeferralAvailable: false,
    deadlineRemains: 500,
    trace,
    receipts,
  };
  await mkdir("docs/evidence/mcp-integration", { recursive: true });
  const file = `docs/evidence/mcp-integration/independent-${live ? "live" : "typed"}.json`;
  await writeFile(file, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify({
      protocol: negotiated,
      tools: tools.tools.length,
      live,
      verifiedRecovery: true,
      essentialProtected: true,
      evidence: file,
    }),
  );
} finally {
  await client.close();
}
