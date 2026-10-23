import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { api, requestKey } from "../api";
import type { Bootstrap, Mission, Task } from "../types";

import { Field, Modal } from "./Shared";
import { fmt, type Dialog, type Run } from "../model";
export function MissionDialog({
  error,
  dialog: d,
  mission: s,
  boot,
  busy,
  close,
  run,
  action,
  refresh,
  notice,
  onDeleted,
}: {
  error: string;
  dialog: Dialog;
  mission: Mission | null;
  boot: Bootstrap;
  busy: boolean;
  close: () => void;
  run: Run;
  action: (a: Record<string, unknown>) => Promise<void>;
  refresh: () => Promise<void>;
  notice: (s: string) => void;
  onDeleted: () => Promise<void>;
}) {
  const [template, setTemplate] = useState(boot.templates[0]?.id ?? "school"),
    [custom, setCustom] = useState(false),
    [tasks, setTasks] = useState<
      {
        id: string;
        title: string;
        duration: number;
        owner: string;
        required: boolean;
        waitMinutes: number;
        deps: string[];
      }[]
    >([
      {
        id: "task1",
        title: "",
        duration: 5,
        owner: "maya",
        required: true,
        waitMinutes: 0,
        deps: [],
      },
    ]);
  const t = d.task,
    option = d.option,
    owner = boot.identity?.role === "owner";
  const titles: Record<string, string> = {
    new: "What are you getting ready for?",
    task: t?.title ?? "Task details",
    complete: "Report this task complete?",
    pause: "Pause and keep your progress",
    approve: "Review the change",
    resume: "Pick up where you left off",
    clock: "Advance demo time",
    availability: "Report a change in availability",
    delay: "What is taking longer?",
    delete: "Delete this household?",
    "mission-options": "Mission options",
  };
  const perform = (fn: () => Promise<void>) =>
    run(async () => {
      await fn();
      close();
    });
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    perform(async () => {
      if (d.kind === "new") {
        await api("missions", {
          templateId: template,
          title: f.title,
          minutes: Number(f.minutes),
          mode: f.mode,
          ...(custom
            ? {
                taskSpecs: tasks.map((t) => ({
                  ...t,
                  duration: Number(t.duration),
                  waitMinutes: Number(t.waitMinutes),
                })),
              }
            : {}),
        });
        await refresh();
      }
      if (d.kind === "pause")
        await action({
          type: "progress",
          taskId: t!.id,
          operation: "pause",
          remainingMinutes: Number(f.minutes),
        });
      if (d.kind === "resume")
        await action({
          type: "resume_deferred",
          taskId: t!.id,
          readyConfirmed: f.ready === "on",
          deadline: s!.now + Number(f.minutes),
        });
      if (d.kind === "clock")
        await action({ type: "clock", minute: s!.now + Number(f.minutes) });
      if (d.kind === "availability")
        await action({
          type: "availability",
          personId: f.personId,
          minutes: Number(f.minutes),
        });
      if (d.kind === "delay")
        await action({
          type: "delay",
          taskId: f.taskId,
          minutes: Number(f.minutes),
          kind: f.kind,
        });
      if (d.kind === "delete") {
        await api("household/delete", { confirmation: f.confirmation });
        await onDeleted();
      }
      if (d.kind === "task") {
        await action({
          type: "edit_task",
          taskId: t!.id,
          field: f.field,
          value:
            f.field === "required"
              ? f.value === "true"
              : f.field === "duration"
                ? Number(f.value)
                : f.value,
        });
      }
    });
  };
  return (
    <Modal title={titles[d.kind] ?? "ReadyBy"} close={close} busy={busy}>
      <div className="modal-body">
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
        {d.kind === "new" && (
          <form onSubmit={submit}>
            <Field label="Mission name">
              <input
                name="title"
                placeholder={
                  custom
                    ? "My departure"
                    : boot.templates.find((t) => t.id === template)?.name
                }
                maxLength={80}
              />
            </Field>
            <div className="form-grid">
              <Field label="Routine">
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                >
                  {boot.templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Minutes until departure">
                <input
                  key={template}
                  name="minutes"
                  type="number"
                  min={5}
                  max={180}
                  required
                  defaultValue={
                    boot.templates.find((t) => t.id === template)?.minutes ?? 20
                  }
                />
              </Field>
            </div>
            <Field label="Clock">
              <select name="mode">
                <option value="realtime">Live time · starts now</option>
                <option value="demo">Demo time · starts 08:00</option>
              </select>
            </Field>
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={custom}
                onChange={(e) => setCustom(e.target.checked)}
              />{" "}
              Use my own task list
            </label>
            {custom && (
              <div className="custom-tasks">
                <p className="muted small">
                  Up to eight tasks. Estimates and essentials stay editable
                  before starting.
                </p>
                {tasks.map((task, i) => (
                  <div className="custom-task" key={task.id}>
                    <div className="custom-task-header">
                      <strong>Task {i + 1}</strong>
                      <button
                        type="button"
                        className="icon-button"
                        disabled={tasks.length === 1}
                        aria-label={`Remove task ${i + 1}`}
                        onClick={() =>
                          setTasks(
                            tasks
                              .filter((t) => t.id !== task.id)
                              .map((t) => ({
                                ...t,
                                deps: t.deps.filter((id) => id !== task.id),
                              })),
                          )
                        }
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <Field label="Task name">
                      <input
                        value={task.title}
                        required
                        maxLength={80}
                        onChange={(e) =>
                          setTasks(
                            tasks.map((t) =>
                              t.id === task.id
                                ? { ...t, title: e.target.value }
                                : t,
                            ),
                          )
                        }
                      />
                    </Field>
                    <div className="form-grid">
                      <Field label="Duration (min)">
                        <input
                          type="number"
                          min={1}
                          max={90}
                          required
                          value={task.duration}
                          onChange={(e) =>
                            setTasks(
                              tasks.map((t) =>
                                t.id === task.id
                                  ? { ...t, duration: Number(e.target.value) }
                                  : t,
                              ),
                            )
                          }
                        />
                      </Field>
                      <Field label="Assigned adult">
                        <select
                          value={task.owner}
                          onChange={(e) =>
                            setTasks(
                              tasks.map((t) =>
                                t.id === task.id
                                  ? { ...t, owner: e.target.value }
                                  : t,
                              ),
                            )
                          }
                        >
                          {boot.household?.people.map((p, i) => (
                            <option key={i} value={i === 0 ? "maya" : "arun"}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Ready after (min)">
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={task.waitMinutes}
                          onChange={(e) =>
                            setTasks(
                              tasks.map((t) =>
                                t.id === task.id
                                  ? {
                                      ...t,
                                      waitMinutes: Number(e.target.value),
                                    }
                                  : t,
                              ),
                            )
                          }
                        />
                      </Field>
                      <Field label="Starts after">
                        <select
                          value={task.deps[0] ?? ""}
                          onChange={(e) =>
                            setTasks(
                              tasks.map((t) =>
                                t.id === task.id
                                  ? {
                                      ...t,
                                      deps: e.target.value
                                        ? [e.target.value]
                                        : [],
                                    }
                                  : t,
                              ),
                            )
                          }
                        >
                          <option value="">No prerequisite</option>
                          {tasks.slice(0, i).map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title || t.id}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={task.required}
                        onChange={(e) =>
                          setTasks(
                            tasks.map((t) =>
                              t.id === task.id
                                ? { ...t, required: e.target.checked }
                                : t,
                            ),
                          )
                        }
                      />{" "}
                      Essential before departure
                    </label>
                  </div>
                ))}
                <button
                  type="button"
                  className="secondary full"
                  disabled={tasks.length >= 8}
                  onClick={() =>
                    setTasks([
                      ...tasks,
                      {
                        id: "task" + requestKey().slice(0, 6),
                        title: "",
                        duration: 5,
                        owner: "maya",
                        required: true,
                        waitMinutes: 0,
                        deps: [],
                      },
                    ])
                  }
                >
                  <Plus size={16} /> Add task
                </button>
              </div>
            )}
            <button className="primary full" disabled={busy}>
              Create a reviewable draft <ArrowRight size={16} />
            </button>
          </form>
        )}
        {d.kind === "approve" && option && s && (
          <>
            <div className="approval-summary">
              <span className="square-icon">
                <ShieldCheck size={25} />
              </span>
              <h3>
                {option.kind === "defer"
                  ? `Keep departure at ${fmt(s.deadline, s)}`
                  : option.kind === "later"
                    ? `Move ${s.goalKind === "readiness" ? "deadline" : "departure"} to ${fmt(option.deadline, s)}`
                    : "Approve a new allocation"}
              </h3>
              <p>
                {option.kind === "defer"
                  ? `${option.deferred.map((id) => s.tasks.find((t) => t.id === id)?.title).join(", ")} will be saved for later. Required work stays in the plan.`
                  : option.kind === "later"
                    ? "All retained work stays in the plan. Your original deadline will change."
                    : "Pending work may move between adults. Completed and active work stay fixed."}
              </p>
              <strong>Planned finish {fmt(option.finish, s)}</strong>
            </div>
            <p className="muted small">
              ReadyBy checks this proposal again before saving. A change or an
              expired estimate requires a fresh proposal.
            </p>
            <button
              className="primary full"
              disabled={busy}
              onClick={() =>
                perform(() =>
                  action({ type: "approve", proposalId: option.id }),
                )
              }
            >
              Approve this revision <Check size={17} />
            </button>
            <button className="secondary full" disabled={busy} onClick={close}>
              Go back
            </button>
          </>
        )}
        {d.kind === "complete" && t && (
          <>
            <p>
              Confirm that <strong>{t.title.toLowerCase()}</strong> is actually
              finished. ReadyBy records your report; elapsed time does not
              complete a task.
            </p>
            <button
              className="primary full"
              disabled={busy}
              onClick={() =>
                perform(() =>
                  action({
                    type: "progress",
                    taskId: t.id,
                    operation: "complete",
                  }),
                )
              }
            >
              Yes, it’s complete <Check size={17} />
            </button>
            <button className="secondary full" onClick={close}>
              Keep working
            </button>
          </>
        )}
        {d.kind === "task" && t && s && (
          <>
            <div className="task-detail-summary">
              <span className="role-badge">{t.status}</span>
              <span>
                {s.people.find((p) => p.id === t.owner)?.name} · {t.duration}{" "}
                min
              </span>
            </div>
            <p className="muted">
              {t.required
                ? "Essential before departure."
                : "Flexible: ReadyBy may propose saving this for later."}
              {t.deps.length
                ? ` Starts after ${t.deps.map((id) => s.tasks.find((x) => x.id === id)?.title).join(", ")}.`
                : ""}
              {t.barrier
                ? " This final check follows every retained task."
                : ""}
            </p>
            {["pending", "paused"].includes(t.status) ? (
              <TaskEditForm
                task={t}
                s={s}
                busy={busy}
                save={(a) => perform(() => action(a))}
              />
            ) : (
              <p className="small muted">
                {t.status === "active"
                  ? "Pause this task before changing its estimate or owner."
                  : "Completed and deferred work keeps its recorded history."}
              </p>
            )}
          </>
        )}
        {["pause", "resume", "clock", "availability", "delay"].includes(
          d.kind,
        ) &&
          s && (
            <form onSubmit={submit}>
              {d.kind === "pause" && (
                <p>
                  How much active effort remains for <strong>{t?.title}</strong>
                  ? Your reported progress is saved.
                </p>
              )}
              {d.kind === "resume" && (
                <>
                  <p>
                    <strong>{t?.title}</strong> will return as pending work with
                    a new deadline.
                  </p>
                  <label className="checkbox-line readiness">
                    <input name="ready" type="checkbox" required /> I confirm
                    the task can start and the assigned adult is available now.
                  </label>
                </>
              )}
              {d.kind === "clock" && (
                <p>
                  Current demo time is <strong>{fmt(s.now, s)}</strong>.
                  Advancing time never marks work complete.
                </p>
              )}
              {d.kind === "availability" && (
                <Field label="Who is unavailable?">
                  <select name="personId">
                    {s.people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              {d.kind === "delay" && (
                <>
                  <Field label="Task">
                    <select name="taskId">
                      {s.tasks
                        .filter(
                          (t) => !["completed", "deferred"].includes(t.status),
                        )
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label="Change">
                    <select name="kind">
                      <option value="release">
                        Time until a pending task is ready
                      </option>
                      <option value="remaining">
                        Remaining effort for active / paused work
                      </option>
                    </select>
                  </Field>
                </>
              )}
              <Field
                label={
                  d.kind === "resume"
                    ? "Minutes until the new deadline"
                    : d.kind === "pause"
                      ? "Minutes of work remaining"
                      : d.kind === "clock"
                        ? "Minutes to advance"
                        : "Number of minutes"
                }
              >
                <input
                  name="minutes"
                  type="number"
                  min={1}
                  max={
                    d.kind === "resume" ? 180 : d.kind === "pause" ? 90 : 120
                  }
                  defaultValue={
                    d.kind === "pause"
                      ? (t?.remaining ?? t?.duration)
                      : d.kind === "resume"
                        ? 15
                        : 5
                  }
                  required
                />
              </Field>
              <button className="primary full" disabled={busy}>
                Confirm {d.kind === "clock" ? "demo time" : "change"}{" "}
                <Check size={17} />
              </button>
            </form>
          )}
        {d.kind === "mission-options" && s && (
          <>
            <p className="muted">
              {s.title} · {s.phase === "draft" ? "Draft" : "Started"} ·{" "}
              {s.isDemo ? "Demo mission" : "Live mission"}
            </p>
            {s.phase === "draft" && owner && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  perform(async () => {
                    await api("routines", {
                      missionId: s.id,
                      name: f.get("name"),
                    });
                    await refresh();
                    notice("Routine saved for next time.");
                  });
                }}
              >
                <Field label="Save as a reusable routine">
                  <input
                    name="name"
                    required
                    maxLength={60}
                    defaultValue={s.title}
                  />
                </Field>
                <button className="secondary full" disabled={busy}>
                  <RotateCcw size={16} /> Save routine
                </button>
              </form>
            )}
            <button
              className="secondary full"
              disabled={busy}
              onClick={() => perform(() => action({ type: "recalculate" }))}
            >
              <RefreshCw size={16} /> Recalculate from current time
            </button>
            {owner && (
              <button
                className="danger-button full"
                disabled={busy}
                onClick={() =>
                  perform(async () => {
                    await api("missions/archive", { missionId: s.id });
                    await refresh();
                    notice(
                      "Mission archived. Its history remains in your household export.",
                    );
                  })
                }
              >
                <Trash2 size={16} /> Archive this mission
              </button>
            )}
          </>
        )}
        {d.kind === "delete" && (
          <form onSubmit={submit}>
            <p>
              This permanently deletes <strong>{boot.household?.name}</strong>{" "}
              and its saved missions, routines and invitations. Download an
              export first if you need a copy.
            </p>
            <Field label={`Type ${boot.household?.name} to confirm`}>
              <input name="confirmation" required autoComplete="off" />
            </Field>
            <button className="danger-button full" disabled={busy}>
              <Trash2 size={16} /> Permanently delete household
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
function TaskEditForm({
  task,
  s,
  busy,
  save,
}: {
  task: Task;
  s: Mission;
  busy: boolean;
  save: (a: Record<string, unknown>) => void;
}) {
  const [field, setField] = useState("duration");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        save({
          type: "edit_task",
          taskId: task.id,
          field,
          value:
            field === "required"
              ? f.get("value") === "true"
              : field === "duration"
                ? Number(f.get("value"))
                : f.get("value"),
        });
      }}
    >
      <Field label="Change">
        <select value={field} onChange={(e) => setField(e.target.value)}>
          <option value="duration">Duration estimate</option>
          <option value="required">Essential or flexible</option>
          <option value="owner">Assigned adult</option>
        </select>
      </Field>
      <Field
        label={
          field === "duration"
            ? "Minutes"
            : field === "required"
              ? "Priority"
              : "Adult"
        }
      >
        {field === "duration" ? (
          <input
            name="value"
            type="number"
            min={1}
            max={90}
            defaultValue={task.duration}
            required
          />
        ) : field === "required" ? (
          <select name="value" defaultValue={String(task.required)}>
            <option value="true">Essential before departure</option>
            {!task.barrier && (
              <option value="false">Flexible · may save for later</option>
            )}
          </select>
        ) : (
          <select name="value" defaultValue={task.owner}>
            {s.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </Field>
      <button className="primary full" disabled={busy}>
        Save and check the plan <Check size={16} />
      </button>
    </form>
  );
}
