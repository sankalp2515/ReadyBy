import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createPlatformServer } from "../src/platform/server.mjs";
import { MCP_VERSION, MCP_TOOL_NAMES } from "../src/platform/mcp.mjs";

async function setup(t, interpreter, options = {}) {
  let interpretations = 0;
  const app = await createPlatformServer({
    dbFile: ":memory:",
    ...options,
    interpreter: async (s, text) => {
      interpretations++;
      return interpreter
        ? interpreter(s, text)
        : {
            intent: text.includes("yes")
              ? { action: "approve", optionKind: "defer" }
              : text.includes("more time")
                ? { action: "clarify", taskId: "laundry", kind: "release" }
                : {
                    action: "delay",
                    taskId: "laundry",
                    kind: "release",
                    minutes: 15,
                  },
            receipt: { kind: "ai", model: "test-double", latencyMs: 1 },
          };
    },
  });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  t.after(
    () =>
      new Promise((resolve) => {
        app.server.close(resolve);
        app.server.closeAllConnections();
      }),
  );
  async function session() {
    let cookie = "",
      csrf = "";
    const http = async (path, body) => {
      const response = await fetch(base + path, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          Cookie: cookie,
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (response.headers.has("set-cookie"))
        cookie = response.headers.get("set-cookie").split(";")[0];
      const data = await response.json();
      if (data.csrfToken) csrf = data.csrfToken;
      return { status: response.status, data };
    };
    await http("/api/auth/demo", {});
    const trace = [];
    const client = new Client({
      name: "independent-sdk-test",
      version: "1.0.0",
    });
    await client.connect(
      new StreamableHTTPClientTransport(new URL(base + "/mcp"), {
        requestInit: { headers: { Cookie: cookie, "X-CSRF-Token": csrf } },
        fetch: async (url, init) => {
          const response = await fetch(url, init);
          const rpc =
            typeof init?.body === "string" ? JSON.parse(init.body) : null;
          if (rpc)
            trace.push({
              method: rpc.method,
              version: new Headers(init.headers).get("mcp-protocol-version"),
              status: response.status,
            });
          return response;
        },
      }),
    );
    t.after(() => client.close());
    const call = async (name, args = {}) => {
      const result = await client.callTool({ name, arguments: args });
      return {
        error: result.isError || false,
        data: result.structuredContent || JSON.parse(result.content[0].text),
      };
    };
    const state = async () => (await call("readyby_get_mission")).data.state;
    return {
      client,
      call,
      http,
      state,
      trace,
      get headers() {
        return {
          Cookie: cookie,
          "X-CSRF-Token": csrf,
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "MCP-Protocol-Version": MCP_VERSION,
        };
      },
    };
  }
  return {
    session,
    base,
    get interpretations() {
      return interpretations;
    },
  };
}
const write = (s, a = {}) => ({
  missionId: s.id,
  expectedRevision: s.revision,
  idempotencyKey: randomUUID(),
  ...a,
});

test("prepared calls and review confirmations expire independently of the demo clock", async (t) => {
  let now = 1000000;
  const h = await setup(t, null, { missionNow: () => now }),
    a = await h.session();
  let s = await a.state();
  s = (await a.http("/api/demo/scenario", write(s, { scenario: "delay" }))).data
    .state;
  const prepared = (
    await a.call(
      "readyby_interpret_request",
      write(s, { text: "washer fifteen minutes" }),
    )
  ).data;
  now += 91000;
  assert.equal(
    (await a.call(prepared.toolName, prepared.arguments)).data.code,
    "FORBIDDEN",
  );
  s = (
    await a.call(
      "readyby_report_delay",
      write(s, { taskId: "laundry", minutes: 15 }),
    )
  ).data.state;
  const proposalId = s.proposal.options.find((o) => o.kind === "defer").id;
  const confirmation = await a.http("/api/proposals/confirm", {
    missionId: s.id,
    expectedRevision: s.revision,
    proposalId,
  });
  now += 121000;
  const result = await a.call(
    "readyby_commit_proposal",
    write(s, {
      proposalId,
      confirmationToken: confirmation.data.confirmationToken,
    }),
  );
  assert.equal(result.data.code, "CONFIRMATION_REQUIRED");
  assert.equal(
    (await a.state()).tasks.find((t) => t.id === "laundry").status,
    "pending",
  );
});

test("official independent SDK negotiates 2025-11-25, discovers real tools, reads household state; auth/origin/version gates hold", async (t) => {
  const h = await setup(t),
    a = await h.session();
  const tools = await a.client.listTools();
  assert.deepEqual(
    tools.tools.map((t) => t.name),
    MCP_TOOL_NAMES,
  );
  assert.ok(a.trace.some((r) => r.method === "initialize" && r.status === 200));
  assert.ok(
    a.trace.some(
      (r) => r.method === "notifications/initialized" && r.status === 202,
    ),
  );
  assert.ok(
    a.trace.some((r) => r.method === "tools/list" && r.version === MCP_VERSION),
  );
  const s = await a.state();
  assert.equal(s.analysis.full.finish, 499);
  const rpc = { jsonrpc: "2.0", id: 44, method: "tools/list" };
  assert.equal(
    (
      await fetch(h.base + "/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rpc),
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await fetch(h.base + "/mcp", {
        method: "POST",
        headers: { ...a.headers, Origin: "https://attacker.invalid" },
        body: JSON.stringify(rpc),
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(h.base + "/mcp", {
        method: "POST",
        headers: { ...a.headers, "X-CSRF-Token": "wrong" },
        body: JSON.stringify(rpc),
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(h.base + "/mcp", {
        method: "POST",
        headers: { ...a.headers, "MCP-Protocol-Version": "2024-11-05" },
        body: JSON.stringify(rpc),
      })
    ).status,
    400,
  );
  assert.equal(
    (await fetch(h.base + "/mcp", { headers: a.headers })).status,
    405,
  );
});

test("typed MCP recovery preserves progress and essential work; exact review confirmation is scoped, single-use and retry-safe", async (t) => {
  const h = await setup(t),
    a = await h.session(),
    b = await h.session();
  let s = await a.state();
  s = (await a.http("/api/demo/scenario", write(s, { scenario: "delay" }))).data
    .state;
  const complete = s.tasks
    .filter((t) => t.status === "completed")
    .map((t) => t.id);
  let r = await a.call(
    "readyby_report_delay",
    write(s, { taskId: "laundry", minutes: 15, kind: "release" }),
  );
  assert.equal(r.error, false);
  s = r.data.state;
  assert.equal(s.analysis.full.finish, 508);
  assert.deepEqual(
    s.tasks.filter((t) => t.status === "completed").map((t) => t.id),
    complete,
  );
  const proposalId = s.proposal.options.find((o) => o.kind === "defer").id;
  assert.equal(s.tasks.find((t) => t.id === "laundry").status, "pending");
  r = await a.call(
    "readyby_commit_proposal",
    write(s, { proposalId, confirmationToken: "invented" }),
  );
  assert.equal(r.data.code, "CONFIRMATION_REQUIRED");
  assert.equal(
    (await b.call("readyby_get_mission", { missionId: s.id })).data.code,
    "NOT_FOUND",
  );
  const confirmation = await a.http("/api/proposals/confirm", {
    missionId: s.id,
    expectedRevision: s.revision,
    proposalId,
  });
  const approved = write(s, {
    proposalId,
    confirmationToken: confirmation.data.confirmationToken,
  });
  r = await a.call("readyby_commit_proposal", approved);
  assert.equal(r.error, false);
  s = r.data.state;
  assert.equal(s.tasks.find((t) => t.id === "laundry").status, "deferred");
  assert.equal(s.deadline, 500);
  assert.equal(s.receipts.at(-1).mcp.tool, "readyby_commit_proposal");
  assert.ok(!JSON.stringify(s).includes(confirmation.data.confirmationToken));
  assert.equal(
    (await a.call("readyby_commit_proposal", approved)).data.duplicate,
    true,
  );
  assert.equal(
    (
      await a.call("readyby_commit_proposal", {
        ...approved,
        idempotencyKey: randomUUID(),
      })
    ).data.code,
    "STALE_REVISION",
  );
  s = (await a.http("/api/demo/scenario", write(s, { scenario: "essential" })))
    .data.state;
  s = (
    await a.call(
      "readyby_report_delay",
      write(s, { taskId: "laundry", minutes: 15 }),
    )
  ).data.state;
  assert.ok(!s.proposal.options.some((o) => o.kind === "defer"));
  assert.equal(s.deadline, 500);
});

test("two actual MCP calls prepare then execute a model-selected tool; tampering, stale state and cross-session replay are rejected", async (t) => {
  const h = await setup(t),
    a = await h.session(),
    b = await h.session();
  let s = await a.state();
  s = (await a.http("/api/demo/scenario", write(s, { scenario: "delay" }))).data
    .state;
  const request = write(s, { text: "washer fifteen minutes" });
  const p = (await a.call("readyby_interpret_request", request)).data;
  assert.equal(p.toolName, "readyby_report_delay");
  assert.equal(h.interpretations, 1);
  assert.equal(
    (await a.call("readyby_interpret_request", request)).data.arguments
      .preparedToken,
    p.arguments.preparedToken,
  );
  assert.equal(h.interpretations, 1);
  assert.equal(
    (await a.call(p.toolName, { ...p.arguments, minutes: 1 })).data.code,
    "FORBIDDEN",
  );
  assert.equal((await b.call(p.toolName, p.arguments)).data.code, "FORBIDDEN");
  let r = await a.call(p.toolName, p.arguments);
  assert.equal(r.error, false);
  s = r.data.state;
  assert.equal(s.analysis.full.finish, 508);
  assert.equal(s.receipts.at(-1).kind, "ai");
  assert.equal(s.receipts.at(-1).mcp.method, "tools/call");
  assert.equal((await a.call(p.toolName, p.arguments)).data.duplicate, true);
  const stale = (
    await a.call(
      "readyby_interpret_request",
      write(s, { text: "washer fifteen minutes" }),
    )
  ).data;
  s = (
    await a.call(
      "readyby_edit_task",
      write(s, { taskId: "laundry", field: "required", value: true }),
    )
  ).data.state;
  assert.equal(
    (await a.call(stale.toolName, stale.arguments)).data.code,
    "STALE_REVISION",
  );
});

test("MCP clarification avoids another model call; a natural-language yes cannot commit a proposal", async (t) => {
  const h = await setup(t),
    a = await h.session();
  let s = await a.state();
  s = (await a.http("/api/demo/scenario", write(s, { scenario: "delay" }))).data
    .state;
  async function command(text) {
    const p = (await a.call("readyby_interpret_request", write(s, { text })))
      .data;
    const r = await a.call(p.toolName, p.arguments);
    assert.equal(r.error, false);
    s = r.data.state;
    return r.data;
  }
  await command("washer needs more time");
  assert.equal(s.pendingClarification.taskId, "laundry");
  await command("fifteen minutes");
  assert.equal(h.interpretations, 1);
  assert.equal(s.receipts.at(-1).kind, "conversation");
  const revision = s.revision;
  const result = await command("yes");
  assert.match(result.reply, /review/i);
  assert.equal(s.revision, revision);
  assert.equal(s.tasks.find((t) => t.id === "laundry").status, "pending");
  assert.ok(s.proposal.options.length);
});
