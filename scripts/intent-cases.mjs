import { initialState } from "../src/readyby/fixtures.mjs";
import { applyAction } from "../src/readyby/reducer.mjs";
let active = applyAction(initialState(), {
  type: "start_mission",
  expectedRevision: 0,
  idempotencyKey: "eval-start",
}).state;
const recovery = structuredClone(active);
recovery.clock.now = 486;
recovery.tasks.find((t) => t.id === "laundry").release = 501;
const trigger = applyAction(recovery, {
  type: "recalculate",
  expectedRevision: recovery.revision,
  idempotencyKey: "eval-replan",
}).state;
export const intentCases = [
  ["Show what is left", active, { action: "status" }],
  ["Can we still leave on time?", active, { action: "status" }],
  ["Start the mission", initialState(), { action: "start_mission" }],
  [
    "Plan our departure for 8:25",
    initialState(),
    { action: "draft_mission", deadline: 505 },
  ],
  [
    "The school bag is packed",
    active,
    { action: "progress", taskId: "bag", operation: "complete" },
  ],
  [
    "I finished packing lunch",
    active,
    { action: "progress", taskId: "lunch", operation: "complete" },
  ],
  [
    "Start packing the school bag",
    active,
    { action: "progress", taskId: "bag", operation: "start" },
  ],
  [
    "The washer still has fifteen minutes left",
    active,
    { action: "delay", taskId: "laundry", minutes: 15, kind: "release" },
  ],
  [
    "Washing machine says another 12 minutes",
    active,
    { action: "delay", taskId: "laundry", minutes: 12, kind: "release" },
  ],
  [
    "Make laundry essential",
    active,
    { action: "edit_task", taskId: "laundry", field: "required", value: true },
  ],
  [
    "Laundry can wait until later",
    active,
    { action: "edit_task", taskId: "laundry", field: "required", value: false },
  ],
  [
    "Packing the school bag takes seven minutes",
    active,
    { action: "edit_task", taskId: "bag", field: "duration", value: 7 },
  ],
  [
    "Arun is unavailable for ten minutes",
    active,
    { action: "availability", personId: "arun", minutes: 10 },
  ],
  [
    "Yes, defer the laundry and keep our departure",
    trigger,
    { action: "approve", optionKind: "defer" },
  ],
  ["No, keep the current commitments", trigger, { action: "reject" }],
  ["Recalculate the plan", active, { action: "recalculate" }],
  ["Maybe Arun packed lunch", active, { action: "clarify" }],
  ["Don't mark the school bag complete", active, { action: "clarify" }],
  ["We are done", active, { action: "clarify" }],
  ["Unlock my front door remotely", active, { action: "clarify" }],
  // Additional holdout phrasing: not added to the prompt examples.
  [
    "The washing cycle needs 19 more minutes",
    active,
    { action: "delay", taskId: "laundry", minutes: 19, kind: "release" },
  ],
  [
    "Change filling bottles to a four minute task",
    active,
    { action: "edit_task", taskId: "bottles", field: "duration", value: 4 },
  ],
  ["Could you tell us our next step?", active, { action: "status" }],
  ["I have not finished packing lunch", active, { action: "clarify" }],
  [
    "Breakfast must be finished before we go",
    active,
    {
      action: "edit_task",
      taskId: "breakfast",
      field: "required",
      value: true,
    },
  ],
  [
    "Arun cannot help for 17 minutes",
    active,
    { action: "availability", personId: "arun", minutes: 17 },
  ],
  ["Nope", trigger, { action: "reject" }],
  ["Please check the schedule again", active, { action: "recalculate" }],
  ["At what time should we leave?", active, { action: "status" }],
  [
    "Use an 08:40 departure for this draft",
    initialState(),
    { action: "draft_mission", deadline: 520 },
  ],
];
