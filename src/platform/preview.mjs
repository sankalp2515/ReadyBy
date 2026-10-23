import { rehearsal } from "./scenarios.mjs";
import { applyAction, viewState } from "../readyby/reducer.mjs";

// Public samples contain only fixed fictional fixtures, never a household read.
export function publicPreview() {
  return ["opening", "delay", "essential"].map((chapter) => {
    let state = rehearsal(chapter);
    if (chapter !== "opening")
      state = applyAction(state, {
        type: "delay",
        taskId: "laundry",
        minutes: 15,
        kind: "release",
        expectedRevision: state.revision,
        idempotencyKey: "public-preview-delay",
      }).state;
    const v = viewState(state);
    return {
      chapter,
      deadline: v.deadline,
      finish: v.analysis.full.finish,
      verified: v.analysis.full.verification?.valid === true,
      completed: v.tasks
        .filter((t) => t.status === "completed")
        .map((t) => t.title),
      options: (v.proposal?.options ?? []).map((o) => ({
        kind: o.kind,
        finish: o.finish,
        deadline: o.deadline,
      })),
      tasks: v.tasks.map((t) => ({
        title: t.title,
        owner: v.people.find((p) => p.id === t.owner)?.name,
        status: t.status,
        required: t.required,
      })),
    };
  });
}
