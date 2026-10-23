import { currentTime } from "./clock.mjs";

const units = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const tens = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

export function durationAnswer(text) {
  if (typeof text !== "string") return null;
  const clean = text
    .toLowerCase()
    .trim()
    .replace(/[.!]$/, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
  const match = /^(?:another )?(.+?)(?: minutes?(?: left| remaining)?)?$/.exec(
    clean,
  );
  if (!match) return null;
  const value = match[1];
  if (/^\d{1,3}$/.test(value))
    return Number(value) <= 120 ? Number(value) : null;
  const words = value.split(" ");
  if (words.length === 1 && units.includes(value)) return units.indexOf(value);
  if (words.length === 1 && value in tens) return tens[value];
  if (
    words.length === 2 &&
    words[0] in tens &&
    units.indexOf(words[1]) > 0 &&
    units.indexOf(words[1]) < 10
  )
    return tens[words[0]] + units.indexOf(words[1]);
  return null;
}

export function resolveClarification(s, text, now = Date.now()) {
  const p = s.pendingClarification;
  if (
    !p ||
    p.revision !== s.revision ||
    p.expiresAt < now ||
    p.missionMinute !== currentTime(s)
  )
    return null;
  const minutes = durationAnswer(text);
  const task = s.tasks.find((t) => t.id === p.taskId);
  if (minutes === null || !task || task.status !== "pending") return null;
  return {
    intent: { action: "delay", taskId: p.taskId, kind: "release", minutes },
    receipt: {
      id: crypto.randomUUID(),
      kind: "conversation",
      provider: "Bounded clarification resolver",
      latencyMs: 0,
      intent: { action: "delay", taskId: p.taskId, kind: "release", minutes },
      at: new Date(now).toISOString(),
      normalizations: [
        "Explicit duration answered the current washer question; no new AI call",
      ],
    },
  };
}

export function clarifyUnscopedDuration(text) {
  if (durationAnswer(text) === null) return null;
  const intent = {
    action: "clarify",
    question:
      "Which task do those minutes apply to? Please name the task and the change.",
  };
  return {
    intent,
    receipt: {
      id: crypto.randomUUID(),
      kind: "conversation",
      provider: "Conversation policy",
      intent,
      at: new Date().toISOString(),
      normalizations: [
        "A duration without a current scoped question cannot select a task or change the plan",
      ],
    },
  };
}

export function pendingQuestion(s, intent, text, now = Date.now()) {
  if (
    intent.action !== "clarify" ||
    s.phase !== "active" ||
    durationAnswer(text) !== null
  )
    return null;
  // Scope only an explicitly named washer update to the one matching wait task.
  // Never guess a physical completion, task duration, or approval.
  if (
    !/\b(washer|washing)\b/i.test(text) ||
    !/\b(time|longer|delayed|delay|left|remaining)\b/i.test(text)
  )
    return null;
  const candidates = s.tasks.filter(
    (t) => t.status === "pending" && /wash/i.test(t.waitLabel ?? ""),
  );
  if (
    candidates.length !== 1 ||
    (intent.taskId && intent.taskId !== candidates[0].id)
  )
    return null;
  return {
    taskId: candidates[0].id,
    revision: s.revision,
    missionMinute: currentTime(s),
    expiresAt: now + 300000,
    question: "How many minutes are left on the washer?",
  };
}
