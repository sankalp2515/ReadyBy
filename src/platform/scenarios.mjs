import { randomUUID } from "node:crypto";
import { initialState } from "../readyby/fixtures.mjs";
import { applyAction } from "../readyby/reducer.mjs";
import { requireThat } from "../readyby/schema.mjs";
export function rehearsal(scenario = "opening") {
  requireThat(
    ["opening", "delay", "essential", "return"].includes(scenario),
    "Unknown demo chapter.",
  );
  let s = initialState();
  s.title = "School run";
  s.isDemo = true;
  s.templateId = "school";
  const step = (a) => {
    s = applyAction(s, {
      ...a,
      expectedRevision: s.revision,
      idempotencyKey: randomUUID(),
    }).state;
  };
  step({ type: "start_mission" });
  if (scenario !== "opening") {
    for (const a of [
      { type: "progress", taskId: "bag", operation: "start" },
      { type: "progress", taskId: "lunch", operation: "start" },
      { type: "clock", minute: 484 },
      { type: "progress", taskId: "lunch", operation: "complete" },
      { type: "progress", taskId: "bottles", operation: "start" },
      { type: "clock", minute: 485 },
      { type: "progress", taskId: "bag", operation: "complete" },
      { type: "progress", taskId: "breakfast", operation: "start" },
      { type: "clock", minute: 486 },
    ])
      step(a);
    if (scenario === "essential")
      step({
        type: "edit_task",
        taskId: "laundry",
        field: "required",
        value: true,
      });
    if (scenario === "return") {
      step({ type: "delay", taskId: "laundry", minutes: 15 });
      step({
        type: "approve",
        proposalId: s.proposal.options.find((x) => x.kind === "defer").id,
      });
      for (const a of [
        { type: "clock", minute: 487 },
        { type: "progress", taskId: "bottles", operation: "complete" },
        { type: "clock", minute: 491 },
        { type: "progress", taskId: "breakfast", operation: "complete" },
        { type: "progress", taskId: "shoes", operation: "start" },
        { type: "clock", minute: 494 },
        { type: "progress", taskId: "shoes", operation: "complete" },
        { type: "progress", taskId: "final", operation: "start" },
        { type: "clock", minute: 496 },
        { type: "progress", taskId: "final", operation: "complete" },
        { type: "clock", minute: 540 },
      ])
        step(a);
    }
  }
  s.demoChapter = scenario;
  s.messages = [
    {
      role: "assistant",
      text: `Demo chapter: ${scenario}. Progress and time were explicitly seeded through real task actions. The next request can use live local AI.`,
    },
  ];
  return s;
}
