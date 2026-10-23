import { initialState } from "../readyby/fixtures.mjs";
import { validateMission, requireThat } from "../readyby/schema.mjs";
export const templates = [
  {
    id: "school",
    name: "School run",
    description: "Bags, breakfast and the last-minute things.",
    minutes: 20,
    icon: "backpack",
    taskCount: 7,
  },
  {
    id: "guests",
    name: "Guests arriving",
    description: "Share the prep. Enjoy the welcome.",
    minutes: 35,
    icon: "sparkles",
    taskCount: 6,
  },
  {
    id: "outing",
    name: "Out the door",
    description: "A simpler start for a day together.",
    minutes: 20,
    icon: "sun",
    taskCount: 5,
  },
];
export function createMission({
  templateId = "school",
  names = ["Maya", "Arun"],
  mode = "realtime",
  title,
  minutes,
  taskSpecs,
  timezone = "Asia/Kolkata",
} = {}) {
  requireThat(
    ["school", "guests", "outing"].includes(templateId),
    "Choose an available routine.",
  );
  requireThat(["demo", "realtime"].includes(mode), "Choose demo or live time.");
  if (title !== undefined)
    requireThat(typeof title === "string", "Mission name must be text.");
  if (taskSpecs !== undefined)
    requireThat(
      Array.isArray(taskSpecs) &&
        taskSpecs.length >= 1 &&
        taskSpecs.length <= 8,
      "Use one to eight tasks.",
    );
  if (taskSpecs)
    for (const t of taskSpecs) {
      requireThat(
        t && typeof t === "object" && !Array.isArray(t),
        "Each task must be an object.",
      );
      requireThat(
        Number.isInteger(t.waitMinutes ?? 0) &&
          (t.waitMinutes ?? 0) >= 0 &&
          (t.waitMinutes ?? 0) <= 120,
        "Task readiness must be 0–120 minutes.",
      );
    }
  const state = initialState({ mode }),
    start = state.start;
  requireThat(
    typeof timezone === "string" && timezone.length <= 80,
    "Invalid time zone.",
  );
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
  } catch {
    requireThat(false, "Choose a valid time zone.");
  }
  state.clock.timezone = timezone;
  requireThat(
    Array.isArray(names) &&
      names.length >= 1 &&
      names.length <= 2 &&
      names.every(
        (x) =>
          typeof x === "string" &&
          x.trim().length >= 1 &&
          x.trim().length <= 40,
      ),
    "Use one or two participant names.",
  );
  state.people = state.people
    .slice(0, names.length)
    .map((p, i) => ({ ...p, name: names[i].trim() }));
  const ids = state.people.map((p) => p.id),
    owner = (i) => ids[i % ids.length];
  const custom = (
    id,
    title,
    duration,
    index,
    deps = [],
    required = true,
    extra = {},
  ) => ({
    id,
    title,
    duration,
    owner: owner(index),
    deps,
    required,
    eligible: ids,
    release: start,
    status: "pending",
    estimateSource: "Editable routine estimate",
    ...extra,
  });
  if (templateId === "guests") {
    state.tasks = [
      custom("table", "Set the table", 8, 0),
      custom("tidy", "Tidy the living room", 10, 1),
      custom("drinks", "Prepare drinks", 5, 1, ["tidy"]),
      custom("snacks", "Arrange snacks", 6, 0, ["table"]),
      custom("flowers", "Arrange flowers", 5, 0, [], false),
      custom("final", "Final welcome check", 2, 0, [], true, { barrier: true }),
    ];
  }
  if (templateId === "outing") {
    state.tasks = [
      custom("bag", "Pack the day bag", 6, 0),
      custom("bottles", "Fill water bottles", 3, 1),
      custom("shoes", "Get shoes ready", 4, 0, ["bag"]),
      custom("snacks", "Pack snacks", 4, 1, ["bottles"], false),
      custom("final", "Final check and lock up", 2, 0, [], true, {
        barrier: true,
      }),
    ];
  }
  if (taskSpecs) {
    requireThat(
      Array.isArray(taskSpecs) &&
        taskSpecs.length >= 1 &&
        taskSpecs.length <= 8,
      "Use one to eight tasks.",
    );
    state.tasks = taskSpecs.map((t, i) =>
      custom(
        t.id || `task${i + 1}`,
        t.title,
        t.duration,
        i,
        t.deps ?? [],
        t.required ?? true,
        {
          owner: ids.includes(t.owner) ? t.owner : owner(i),
          release: start + (t.waitMinutes ?? 0),
          barrier: t.barrier === true,
        },
      ),
    );
  }
  state.tasks = state.tasks.map((t) => ({
    ...t,
    owner: ids.includes(t.owner) ? t.owner : owner(0),
    eligible: ids,
  }));
  state.title =
    title?.trim() ||
    templates.find((t) => t.id === templateId)?.name ||
    "My departure";
  requireThat(state.title.length <= 80, "Mission name is too long.");
  const budget =
    minutes ?? templates.find((t) => t.id === templateId)?.minutes ?? 20;
  requireThat(
    Number.isInteger(budget) && budget >= 5 && budget <= 180,
    "Choose a deadline 5–180 minutes from now.",
  );
  state.deadline = start + budget;
  state.isDemo = mode === "demo";
  state.templateId = templateId;
  state.goalKind = templateId === "guests" ? "readiness" : "departure";
  state.messages = [
    {
      role: "assistant",
      text: `Your ${state.title.toLowerCase()} plan is ready to review. Check the estimates and essentials, then start when you're ready.`,
    },
  ];
  return validateMission(state);
}
