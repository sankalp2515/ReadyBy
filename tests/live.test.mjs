import test from "node:test";
import assert from "node:assert/strict";
import { createLiveService, liveConfiguration } from "../src/platform/live.mjs";
import { openDatabase } from "../src/platform/database.mjs";
import { publicPreview } from "../src/platform/preview.mjs";

test("voice credentials are single-use, time-limited and locked to the bounded tool configuration", async () => {
  let request;
  const voice = createLiveService({
    key: "permanent-test-secret",
    now: () => 1000000,
    issue: async (r) => {
      request = r;
      return { name: "ephemeral-test-token" };
    },
  });
  const result = await voice.start();
  assert.equal(request.config.uses, 1);
  assert.equal(new Date(request.config.expireTime).getTime(), 1180000);
  assert.equal(
    new Date(request.config.newSessionExpireTime).getTime(),
    1060000,
  );
  assert.deepEqual(
    request.config.liveConnectConstraints.config,
    liveConfiguration(),
  );
  assert.equal(result.token, "ephemeral-test-token");
  assert.equal(JSON.stringify(result).includes("permanent-test-secret"), false);
  assert.deepEqual(
    result.config.tools[0].functionDeclarations.map((t) => t.name),
    ["household_request"],
  );
  assert.match(result.config.systemInstruction, /Approval requires/);
});
test("voice without a configured key fails before issuing credentials", async () => {
  const voice = createLiveService({ key: "" });
  assert.equal(voice.health().available, false);
  await assert.rejects(voice.start(), /unavailable/);
});
test("provider failures do not expose key or upstream error details", async () => {
  const voice = createLiveService({
    key: "secret",
    issue: async () => {
      throw new Error("sensitive upstream secret");
    },
  });
  await assert.rejects(
    voice.start(),
    (e) => !e.message.includes("sensitive") && !e.message.includes("secret"),
  );
});
test("demo allowance cannot be exceeded and remains in the database", () => {
  const d = openDatabase(":memory:");
  try {
    d.reserveUsage("month", 2);
    d.reserveUsage("month", 2);
    assert.throws(() => d.reserveUsage("month", 2), /allowance/);
    assert.equal(
      d.db.prepare("SELECT count FROM usage_counters WHERE key=?").get("month")
        .count,
      2,
    );
    d.reserveUsage("next-month", 2);
  } finally {
    d.db.close();
  }
});
test("public preview contains computed fictional schedule results and no household identifiers", () => {
  const samples = publicPreview();
  assert.equal(samples.length, 3);
  const delay = samples.find((s) => s.chapter === "delay");
  assert.equal(delay.verified, true);
  assert.ok(delay.finish > delay.deadline);
  assert.ok(
    delay.options.some((o) => o.kind === "defer" && o.finish <= delay.deadline),
  );
  assert.equal(
    samples
      .find((s) => s.chapter === "essential")
      .options.some((o) => o.kind === "defer"),
    false,
  );
  assert.equal(JSON.stringify(samples).includes("householdId"), false);
  assert.equal(JSON.stringify(samples).includes("csrf"), false);
});
