import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createPlatformServer } from "../src/platform/server.mjs";
import { openDatabase } from "../src/platform/database.mjs";
import { createMission } from "../src/platform/templates.mjs";
import { rehearsal } from "../src/platform/scenarios.mjs";
import { rateLimiter } from "../src/platform/security.mjs";
import { DomainError } from "../src/readyby/schema.mjs";
import { applyAction } from "../src/readyby/reducer.mjs";

async function harness(t, options = {}) {
  let calls = 0;
  const app = await createPlatformServer({
    dbFile: ":memory:",
    health: async () => ({ available: true }),
    interpreter: async (s, text) => {
      calls++;
      return {
        intent:
          text === "delay"
            ? {
                action: "delay",
                taskId: "laundry",
                kind: "release",
                minutes: 15,
              }
            : { action: "status" },
        receipt: { kind: "ai", model: "test-double", latencyMs: 1 },
      };
    },
    ...options,
  });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        app.server.close(resolve);
        app.server.closeAllConnections();
      }),
  );
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const client = () => {
    let cookie = "",
      csrf = "";
    return {
      async call(path, body, extra = {}) {
        const response = await fetch(base + "/api/" + path, {
          method: body === undefined ? "GET" : "POST",
          headers: {
            ...(body === undefined
              ? {}
              : { "Content-Type": "application/json", "X-CSRF-Token": csrf }),
            Cookie: cookie,
            ...extra,
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        if (response.headers.has("set-cookie"))
          cookie = response.headers.get("set-cookie").split(";")[0];
        const data = await response.json();
        if (data.csrfToken) csrf = data.csrfToken;
        return { status: response.status, data, headers: response.headers };
      },
      get cookie() {
        return cookie;
      },
    };
  };
  return {
    ...app,
    client,
    base,
    get calls() {
      return calls;
    },
  };
}
const account = (username) => ({
  username,
  password: "correct horse battery staple",
  displayName: username,
  householdName: username + " home",
  names: [username, "Partner"],
});
const write = (s, a) => ({
  ...a,
  missionId: s.id,
  expectedRevision: s.revision,
  idempotencyKey: randomUUID(),
});

test("clarification survives a read, resolves explicitly once, and cannot approve or bypass state checks", async (t) => {
  let interpretations = 0;
  const h = await harness(t, {
    interpreter: async () => {
      interpretations++;
      return {
        intent: { action: "clarify" },
        receipt: { kind: "ai", model: "test-double", latencyMs: 1 },
      };
    },
  });
  const c = h.client();
  await c.call("auth/demo", {});
  let state = (await c.call("state")).data.state;
  state = (await c.call("demo/scenario", write(state, { scenario: "delay" })))
    .data.state;
  const complete = state.tasks
    .filter((t) => t.status === "completed")
    .map((t) => t.id);
  state = (
    await c.call(
      "command",
      write(state, { text: "The washer needs more time" }),
    )
  ).data.state;
  assert.equal(state.pendingClarification.taskId, "laundry");
  state = (await c.call("state")).data.state;
  const answer = write(state, { text: "fifteen minutes" });
  let result = await c.call("command", answer);
  assert.equal(result.status, 200);
  assert.equal(interpretations, 1);
  state = result.data.state;
  assert.equal(state.pendingClarification, null);
  assert.equal(state.analysis.full.finish, 508);
  assert.ok(
    state.proposal.options.some((o) => o.kind === "defer" && o.finish === 496),
  );
  assert.equal(state.tasks.find((t) => t.id === "laundry").status, "pending");
  assert.deepEqual(
    state.tasks.filter((t) => t.status === "completed").map((t) => t.id),
    complete,
  );
  assert.equal(state.receipts.at(-1).kind, "conversation");
  result = await c.call("command", answer);
  assert.equal(result.data.duplicate, true);
  assert.equal(interpretations, 1);
  state = (
    await c.call(
      "command",
      write(state, { text: "The washer needs more time" }),
    )
  ).data.state;
  state = (
    await c.call(
      "action",
      write(state, {
        type: "edit_task",
        taskId: "laundry",
        field: "required",
        value: true,
      }),
    )
  ).data.state;
  assert.equal(state.pendingClarification, null);
  const unscoped = await c.call(
    "command",
    write(state, { text: "fifteen minutes" }),
  );
  assert.equal(interpretations, 2);
  assert.equal(unscoped.data.state.revision, state.revision);
  assert.match(unscoped.data.reply, /Which task/);
  assert.deepEqual(unscoped.data.state.tasks, state.tasks);
});

test("speech endpoints require household authentication and CSRF; invalid audio never mutates a mission", async (t) => {
  const h = await harness(t),
    anonymous = h.client();
  assert.equal((await anonymous.call("speech")).status, 401);
  const c = h.client();
  await c.call("auth/demo", {});
  const before = (await c.call("state")).data.state;
  assert.equal((await c.call("speech/transcribe", { pcm: "bad" })).status, 400);
  assert.equal(
    (
      await c.call(
        "speech/transcribe",
        { pcm: "bad" },
        { "X-CSRF-Token": "wrong" },
      )
    ).status,
    403,
  );
  const after = (await c.call("state")).data.state;
  assert.equal(after.revision, before.revision);
  assert.deepEqual(after.tasks, before.tasks);
});

test("household authentication, CSRF, scoped mission access and persistence", async (t) => {
  const h = await harness(t),
    a = h.client(),
    b = h.client();
  assert.equal(
    (await a.call("missions", { templateId: "school" })).status,
    401,
  );
  const signup = await a.call("auth/signup", account("alice"));
  assert.equal(signup.status, 200);
  assert.match(signup.headers.get("set-cookie"), /HttpOnly; SameSite=Lax/);
  assert.ok(signup.data.recoveryCode);
  assert.equal(signup.data.identity.role, "owner");
  await b.call("auth/signup", account("bob"));
  assert.equal(
    (
      await a.call(
        "missions",
        { templateId: "school" },
        { "X-CSRF-Token": "wrong" },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await a.call(
        "missions",
        { templateId: "school" },
        { Origin: "https://attacker.example" },
      )
    ).status,
    403,
  );
  let s = (await a.call("missions", { templateId: "school", mode: "demo" }))
    .data.state;
  assert.equal(
    (await b.call("missions/select", { missionId: s.id })).status,
    404,
  );
  assert.equal(
    (await b.call("action", write(s, { type: "start_mission" }))).status,
    404,
  );
  const read = await b.call("state?missionId=" + s.id);
  assert.equal(read.data.state, null);
  await b.call("missions", { templateId: "outing" });
  assert.equal((await b.call("state?missionId=" + s.id)).status, 404);
  const started = await a.call("action", write(s, { type: "start_mission" }));
  assert.equal(started.status, 200);
  s = started.data.state;
  const payload = write(s, {
      type: "progress",
      taskId: "bag",
      operation: "complete",
    }),
    result = await a.call("action", payload);
  assert.equal(result.status, 200);
  const retry = await a.call("action", payload);
  assert.equal(retry.status, 200);
  assert.equal(retry.data.duplicate, true);
  assert.equal(retry.data.state.revision, result.data.state.revision);
  assert.equal(
    (await a.call("action", { ...payload, idempotencyKey: randomUUID() }))
      .status,
    409,
  );
  assert.equal(
    (await a.call("action", { ...payload, type: "recalculate" })).status,
    400,
  );
  const out = await a.call("household/export");
  assert.equal(out.data.missions.length, 1);
  assert.ok(!JSON.stringify(out.data).includes("password_hash"));
  const oldCookie = a.cookie;
  await a.call("auth/logout", {});
  assert.equal((await a.call("state")).status, 401);
  assert.equal(h.database.session(oldCookie.split("=")[1]), null);
  assert.equal(
    (await a.call("auth/login", { username: "alice", password: "wrong" }))
      .status,
    401,
  );
  assert.equal((await a.call("auth/login", account("alice"))).status, 200);
  assert.equal(
    (await a.call("state")).data.state.revision,
    result.data.state.revision,
  );
});

test("invitation is one-use; member access is bounded and can be revoked", async (t) => {
  const h = await harness(t),
    owner = h.client(),
    member = h.client(),
    outsider = h.client();
  await owner.call("auth/signup", account("owner"));
  await member.call("auth/signup", account("member"));
  await outsider.call("auth/signup", account("outsider"));
  const household = (await owner.call("bootstrap")).data.household;
  const code = (await owner.call("household/invite", {})).data.code;
  assert.equal((await member.call("household/join", { code })).status, 200);
  assert.equal((await outsider.call("household/join", { code })).status, 404);
  assert.equal((await member.call("bootstrap")).data.identity.role, "member");
  assert.equal((await member.call("household/invite", {})).status, 403);
  assert.equal(
    (await member.call("household/delete", { confirmation: household.name }))
      .status,
    403,
  );
  const s = (
    await member.call("missions", { templateId: "outing", mode: "demo" })
  ).data.state;
  assert.ok(s.id);
  assert.equal(
    (await member.call("routines", { missionId: s.id, name: "My routine" }))
      .status,
    403,
  );
  assert.equal(
    (await outsider.call("household/switch", { id: household.id })).status,
    403,
  );
  const workspaces = (await member.call("household/members")).data.households;
  assert.equal(workspaces.length, 2);
  await owner.call("household/remove-member", { username: "member" });
  assert.equal((await member.call("state")).status, 401);
  assert.equal((await owner.call("household/members")).data.members.length, 1);
});

test("recovery code rotates, invalidates sessions, and cannot be reused", async (t) => {
  const h = await harness(t),
    a = h.client();
  const { data } = await a.call("auth/signup", account("recover"));
  const recovered = await a.call("auth/recover", {
    username: "recover",
    recoveryCode: data.recoveryCode,
    password: "a new long passphrase here",
  });
  assert.equal(recovered.status, 200);
  assert.notEqual(recovered.data.recoveryCode, data.recoveryCode);
  assert.equal((await a.call("state")).status, 401);
  assert.equal(
    (
      await a.call("auth/recover", {
        username: "recover",
        recoveryCode: data.recoveryCode,
        password: "another long passphrase",
      })
    ).status,
    401,
  );
  assert.equal((await a.call("auth/login", account("recover"))).status, 401);
  assert.equal(
    (
      await a.call("auth/login", {
        username: "recover",
        password: "a new long passphrase here",
      })
    ).status,
    200,
  );
});

test("routine, demo chapters, model receipts and command retries use real reducer state", async (t) => {
  const h = await harness(t),
    a = h.client();
  await a.call("auth/demo", {});
  assert.equal((await a.call("household/invite", {})).status, 400);
  let s = (await a.call("missions", { templateId: "school", mode: "demo" }))
    .data.state;
  const routine = await a.call("routines", {
    missionId: s.id,
    name: "Morning rhythm",
  });
  assert.equal(routine.status, 200);
  s = (await a.call("routines/start", { id: routine.data.id, mode: "demo" }))
    .data.state;
  assert.equal(s.title, "Morning rhythm");
  s = (await a.call("demo/scenario", write(s, { scenario: "delay" }))).data
    .state;
  assert.equal(s.now, 486);
  const payload = write(s, { text: "delay" });
  const changed = await a.call("command", payload);
  assert.equal(changed.status, 200);
  s = changed.data.state;
  assert.equal(s.analysis.full.finish, 508);
  assert.equal(s.proposal.options.find((o) => o.kind === "defer").finish, 496);
  assert.equal(s.receipts.at(-1).model, "test-double");
  const retry = await a.call("command", payload);
  assert.equal(retry.data.duplicate, true);
  assert.equal(h.calls, 1);
  const approval = await a.call("proposals/confirm", {missionId:s.id,expectedRevision:s.revision,proposalId:s.proposal.options.find(o=>o.kind==='defer').id});
  s = (
    await a.call(
      "action",
      write(s, {
        confirmationToken: approval.data.confirmationToken,
        type: "approve",
        proposalId: s.proposal.options.find((o) => o.kind === "defer").id,
      }),
    )
  ).data.state;
  assert.equal(s.tasks.find((t) => t.id === "laundry").status, "deferred");
  const live = (
    await a.call("missions", { templateId: "guests", mode: "realtime" })
  ).data.state;
  assert.equal(
    (await a.call("demo/scenario", write(live, { scenario: "delay" }))).status,
    400,
  );
});

test("database survives reopen, rolls back failed writes and deletes household cascades", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "readyby-platform-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = join(dir, "store.sqlite");
  let d = openDatabase(file);
  const a = await d.signup(account("saved"));
  const s = d.create(a.identity, { templateId: "outing", mode: "demo" });
  assert.throws(() =>
    d.atomic(() => {
      d.db.prepare("UPDATE missions SET revision=999 WHERE id=?").run(s.id);
      throw Error("rollback");
    }),
  );
  assert.equal(d.authorizedMission(a.identity, s.id).state.revision, 0);
  d.close();
  d = openDatabase(file);
  assert.ok(d.session(a.raw));
  assert.equal(
    d.authorizedMission(a.identity, s.id).state.title,
    "Out the door",
  );
  assert.equal(
    d.db.prepare("SELECT revision FROM missions WHERE id=?").get(s.id).revision,
    0,
  );
  assert.throws(() => d.deleteHousehold(a.identity, "wrong"));
  d.deleteHousehold(a.identity, "saved home");
  assert.equal(d.session(a.raw), null);
  assert.equal(d.db.prepare("SELECT COUNT(*) AS n FROM missions").get().n, 0);
  d.db.exec("PRAGMA user_version=2");
  d.close();
  assert.throws(() => openDatabase(file), /newer ReadyBy/);
});

test("template constraints and rate limits reject invalid input", () => {
  assert.throws(() => createMission({ mode: "other" }));
  assert.throws(() => createMission({ minutes: 200 }));
  assert.throws(() => createMission({ taskSpecs: {} }), /one to eight/);
  assert.throws(() => createMission({ taskSpecs: [null] }), /object/);
  assert.throws(
    () => createMission({ timezone: "Invalid/Timezone" }),
    /valid time zone/,
  );
  assert.throws(() =>
    createMission({
      taskSpecs: [{ title: "Task", duration: 5, waitMinutes: -4 }],
    }),
  );
  const single = createMission({ names: ["One"], templateId: "guests" });
  assert.equal(single.people.length, 1);
  assert.equal(single.goalKind, "readiness");
  assert.ok(single.tasks.every((t) => t.owner === "maya"));
  const s = rehearsal("essential");
  assert.equal(s.tasks.find((t) => t.id === "laundry").required, true);
  assert.equal(s.clock.now, 486);
  let now = 0;
  const limiter = rateLimiter({ now: () => now });
  limiter.check("key", { limit: 1 });
  assert.throws(() => limiter.check("key", { limit: 1 }));
  now = 60001;
  assert.doesNotThrow(() => limiter.check("key", { limit: 1 }));
});

test("AI outage returns an actionable error without changing saved work", async (t) => {
  const h = await harness(t, {
      interpreter: async () => {
        throw new DomainError(
          "Local AI offline. Use task controls.",
          "AI_UNAVAILABLE",
        );
      },
    }),
    a = h.client();
  await a.call("auth/demo", {});
  const before = (await a.call("state")).data.state;
  const result = await a.call(
    "command",
    write(before, { text: "The washer has fifteen minutes left" }),
  );
  assert.equal(result.status, 503);
  assert.ok(result.data.requestId);
  const after = (await a.call("state")).data.state;
  assert.equal(after.revision, before.revision);
  assert.deepEqual(after.tasks, before.tasks);
  assert.equal(after.receipts.length, 0);
  assert.equal(
    (
      await a.call(
        "action",
        write(after, {
          type: "progress",
          taskId: "bag",
          operation: "complete",
        }),
      )
    ).status,
    200,
  );
});

test("single-adult AI draft defaults remain valid and production requires HTTPS configuration", async () => {
  const s = createMission({ names: ["One adult"], mode: "demo" });
  const updated = applyAction(
    s,
    write(s, {
      type: "draft_mission",
      tasks: [
        { id: "keys", title: "Find keys", duration: 2 },
        { id: "door", title: "Lock door", duration: 1, deps: ["keys"] },
      ],
    }),
  ).state;
  assert.ok(updated.tasks.every((t) => t.owner === "maya"));
  await assert.rejects(
    createPlatformServer({
      dbFile: ":memory:",
      production: true,
      origin: null,
    }),
    /HTTPS/,
  );
  await assert.rejects(
    createPlatformServer({
      dbFile: ":memory:",
      production: true,
      origin: "http:\/\/example.test",
    }),
    /HTTPS/,
  );
});

test("concurrent changes cannot partially commit an interpreted request", async (t) => {
  let release, entered;
  const wait = new Promise((r) => (release = r)),
    seen = new Promise((r) => (entered = r));
  const h = await harness(t, {
      interpreter: async () => {
        entered();
        await wait;
        return {
          intent: {
            action: "delay",
            taskId: "laundry",
            kind: "release",
            minutes: 15,
          },
          receipt: { kind: "ai" },
        };
      },
    }),
    a = h.client();
  await a.call("auth/demo", {});
  let s = (await a.call("state")).data.state;
  const pending = a.call(
    "command",
    write(s, { text: "washer fifteen minutes" }),
  );
  await seen;
  const changed = await a.call(
    "action",
    write(s, { type: "progress", taskId: "bag", operation: "complete" }),
  );
  assert.equal(changed.status, 200);
  release();
  assert.equal((await pending).status, 409);
  const current = (await a.call("state")).data.state;
  assert.equal(current.tasks.find((t) => t.id === "bag").status, "completed");
  assert.equal(
    current.tasks.find((t) => t.id === "laundry").release,
    s.start + 12,
  );
});
