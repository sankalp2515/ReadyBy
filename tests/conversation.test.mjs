import test from "node:test";
import assert from "node:assert/strict";
import {
  durationAnswer,
  pendingQuestion,
  resolveClarification,
} from "../src/readyby/conversation.mjs";
import { rehearsal } from "../src/platform/scenarios.mjs";

test("duration answers are explicit single quantities, never inferred from assent or ambiguous speech", () => {
  for (const [text, value] of [
    ["fifteen minutes", 15],
    ["15", 15],
    ["another twenty-one minutes left", 21],
    ["zero minutes", 0],
    ["120 minutes remaining", 120],
  ])
    assert.equal(durationAnswer(text), value, text);
  for (const text of [
    "yes",
    "no",
    "fifteen or fifty minutes",
    "about fifteen minutes",
    "1200",
    "save laundry",
    "not fifteen minutes",
    "one hundred minutes",
  ])
    assert.equal(durationAnswer(text), null, text);
});
test("washer clarification is bounded to a unique pending wait task and exact state/time", () => {
  const s = rehearsal("delay"),
    now = 1000;
  s.pendingClarification = pendingQuestion(
    s,
    { action: "clarify" },
    "The washer needs more time",
    now,
  );
  assert.equal(s.pendingClarification.taskId, "laundry");
  const resolved = resolveClarification(s, "fifteen minutes", now + 1);
  assert.deepEqual(resolved.intent, {
    action: "delay",
    taskId: "laundry",
    kind: "release",
    minutes: 15,
  });
  assert.equal(resolved.receipt.kind, "conversation");
  assert.equal(resolveClarification(s, "yes", now + 1), null);
  assert.equal(resolveClarification(s, "15", now + 300001), null);
  assert.equal(
    resolveClarification({ ...s, revision: s.revision + 1 }, "15", now + 1),
    null,
  );
  assert.equal(
    resolveClarification(
      { ...s, clock: { ...s.clock, now: s.clock.now + 1 } },
      "15",
      now + 1,
    ),
    null,
  );
  assert.equal(
    pendingQuestion(
      s,
      { action: "clarify", taskId: "bag" },
      "The washer needs more time",
      now,
    ),
    null,
  );
  assert.equal(
    pendingQuestion(s, { action: "clarify" }, "The bag takes longer", now),
    null,
  );
  assert.equal(
    pendingQuestion(
      {
        ...s,
        tasks: [
          ...s.tasks,
          { ...s.tasks.find((t) => t.id === "laundry"), id: "other" },
        ],
      },
      { action: "clarify" },
      "Washer delay",
      now,
    ),
    null,
  );
});
