import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import type { Mission } from "../types";
import { fmt, type Dialog } from "../model";
import { Timeline } from "./Workspace";
import { VoiceComposer } from "./VoiceComposer";
import type { VoiceResult } from "./LiveVoice";

export function HouseholdDisplay({
  mission: s,
  busy,
  action,
  command,
  open,
  setup,
  runtime,
  voiceCommand,
  scenario,
}: {
  mission: Mission;
  busy: boolean;
  action: (a: Record<string, unknown>) => Promise<boolean>;
  command: (text: string) => Promise<boolean>;
  open: (dialog: Dialog) => void;
  setup: () => void;
  runtime: { available: boolean; hosted?: boolean } | null;
  voiceCommand: (text: string) => Promise<VoiceResult>;
  scenario: (chapter: string) => void;
}) {
  const [tab, setTab] = useState("Tasks");
  const completed = s.tasks.filter((t) => t.status === "completed");
  const deferred = s.tasks.filter((t) => t.status === "deferred");
  const remaining = s.tasks.filter(
    (t) => !["completed", "deferred"].includes(t.status),
  );
  const full = s.analysis.full,
    options = s.proposal?.options ?? [];
  const recommended = options.find((o) => o.kind === "defer") ?? options[0];
  const late =
    full.status === "infeasible_proven" ||
    (full.finish !== undefined && full.finish > s.deadline);
  const uncertain = full.status === "unknown_search_limit";
  const latest = s.messages.filter((m) => m.role === "assistant").at(-1)?.text;
  const reply =
    s.pendingClarification?.question ??
    (latest?.startsWith("Demo chapter:") ? s.summary : latest) ??
    s.summary;
  const stateText =
    s.phase === "draft"
      ? "Estimates need your review"
      : recommended
        ? "A decision needs your approval"
        : full.status === "unknown_search_limit"
          ? "Feasibility is unconfirmed"
          : late
            ? "The deadline is at risk"
            : remaining.length
              ? "On track with your estimates"
              : "Retained tasks reported complete";
  return (
    <div className="household-display">
      <div className="simulation-identity">
        <span>Alexa+ experience simulation</span>
        <span>
          {runtime?.hosted
            ? "Cloud AI · Voice available on demand"
            : "Local AI · No device connection"}
        </span>
      </div>
      <header className="household-heading">
        <div>
          <p className="household-purpose">
            When real life changes, the plan changes with it.
          </p>
          <h1>{s.title}</h1>
          <p
            className={
              "household-state " +
              (late || recommended || uncertain ? "attention" : "")
            }
          >
            {late || recommended || uncertain ? (
              <AlertTriangle size={16} />
            ) : (
              <CheckCircle2 size={16} />
            )}{" "}
            {stateText}
          </p>
        </div>
        <div className="household-deadline">
          <span>{s.goalKind === "readiness" ? "Ready by" : "Leave by"}</span>
          <strong>{fmt(s.deadline, s)}</strong>
          <small>
            {s.isDemo ? "Demo clock" : "Now"} {fmt(s.now, s)}
            {s.deadline >= s.now
              ? ` · ${s.deadline - s.now} min to go`
              : " · deadline passed"}
          </small>
        </div>
      </header>
      {s.demoChapter && (
        <p className="seeded-note">
          Demo chapter “{s.demoChapter}”: starting time and progress seeded. New
          requests run live.
        </p>
      )}
      {s.isDemo && (
        <nav className="demo-chapters" aria-label="Guided demo chapters">
          <span>Try a chapter</span>
          {[
            ["opening", "1 · Ordinary morning"],
            ["delay", "2 · Washer delay"],
            ["essential", "3 · Essential stays protected"],
          ].map(([id, label]) => (
            <button
              key={id}
              disabled={busy}
              aria-pressed={s.demoChapter === id}
              onClick={() => scenario(id)}
            >
              {label}
            </button>
          ))}
          <span>Fictional starting state · live requests</span>
        </nav>
      )}
      <nav className="household-tabs" aria-label="Mission views">
        {["Tasks", "Schedule", "History"].map((name) => (
          <button
            key={name}
            aria-pressed={tab === name}
            className={tab === name ? "selected" : ""}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
        <a href="#readyby-conversation">Talk to ReadyBy</a>
      </nav>
      <div className="household-grid">
        <div className="household-voice-region" id="readyby-conversation">
          <VoiceComposer
            key={s.id}
            busy={busy}
            available={runtime?.available ?? null}
            reply={reply}
            onCommand={command}
            onVoiceCommand={voiceCommand}
          />
        </div>
        <aside
          className={
            "household-decision " + (recommended ? "needs-decision" : "")
          }
          aria-label="Current decision and next actions"
        >
          {s.phase === "draft" ? (
            <>
              <span className="decision-label">Before you begin</span>
              <h2>Make this your plan.</h2>
              <p>
                Check the task estimates, people and priorities. Nothing starts
                until you approve the draft.
              </p>
              <div className="decision-metric">
                <span>Estimated finish</span>
                <strong>{fmt(full.finish, s)}</strong>
              </div>
              <button className="primary full" disabled={busy} onClick={setup}>
                Review estimates <ArrowRight size={17} />
              </button>
            </>
          ) : recommended ? (
            <>
              <span className="decision-label">Recommended change</span>
              <h2>
                {recommended.kind === "defer"
                  ? `Keep ${fmt(s.deadline, s)}. Save ${recommended.deferred.map((id) => `“${s.tasks.find((t) => t.id === id)?.title}”`).join(" and ")} for later.`
                  : recommended.kind === "later"
                    ? `Move ${s.goalKind === "readiness" ? "readiness" : "departure"} to ${fmt(recommended.deadline, s)}?`
                    : "Share the work differently?"}
              </h2>
              <p>
                {recommended.kind === "later"
                  ? "Essential work stays protected. A later deadline needs your agreement."
                  : "Nothing changes until you approve. Completed work is preserved."}
              </p>
              <div className="decision-comparison">
                <div>
                  <span>Current full finish</span>
                  <strong>{fmt(full.finish, s)}</strong>
                </div>
                <ArrowRight size={19} />
                <div>
                  <span>Proposed finish</span>
                  <strong>{fmt(recommended.finish, s)}</strong>
                </div>
              </div>
              <p className="decision-buffer">
                {Math.max(0, recommended.deadline - recommended.finish)} min of
                estimated buffer
                {recommended.kind === "later"
                  ? " at the proposed deadline"
                  : ""}
              </p>
              <button
                className="primary full"
                disabled={busy}
                onClick={() => open({ kind: "approve", option: recommended })}
              >
                Review change <ArrowRight size={17} />
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => action({ type: "reject" })}
              >
                Keep current commitments
              </button>
              {options.length > 1 && (
                <details className="other-options">
                  <summary>Other recovery options</summary>
                  {options
                    .filter((o) => o.id !== recommended.id)
                    .map((o) => (
                      <button
                        key={o.id}
                        className="secondary full"
                        disabled={busy}
                        onClick={() => open({ kind: "approve", option: o })}
                      >
                        {o.kind === "later"
                          ? `Review ${fmt(o.deadline, s)} departure`
                          : o.kind === "reassign"
                            ? "Review new allocation"
                            : "Review another deferral"}
                      </button>
                    ))}
                </details>
              )}
            </>
          ) : (
            <>
              <span className="decision-label">
                {uncertain
                  ? "Review the constraints."
                  : remaining.length
                    ? "Your next useful actions"
                    : "Progress preserved"}
              </span>
              <h2>
                {uncertain
                  ? "We haven’t established an on-time plan."
                  : remaining.length
                    ? late
                      ? "The current estimates miss the deadline."
                      : "Keep the morning moving."
                    : "Retained work is reported complete."}
              </h2>
              <div className="decision-metric">
                <span>
                  {remaining.length ? "Planned finish" : "Reported finish"}
                </span>
                <strong>{fmt(full.finish, s)}</strong>
              </div>
              <p>
                {full.status === "unknown_search_limit"
                  ? "The search budget was reached. We cannot conclude whether the deadline is feasible."
                  : late
                    ? "Ask for recovery options or revise a constraint. Essential work cannot be silently dropped."
                    : remaining.length
                      ? `${Math.max(0, s.deadline - (full.finish ?? s.deadline))} min of estimated buffer. Physical progress still needs your report.`
                      : deferred.length
                        ? "Departure has not been confirmed. Saved work still needs attention later."
                        : "Departure has not been confirmed."}
              </p>
              {s.nextActions
                .filter((a) => a.task)
                .map((a) => (
                  <div className="household-next" key={a.person.id}>
                    <strong>{a.person.name}</strong>
                    <span>{a.task!.title}</span>
                    <small>
                      {a.task!.status === "active"
                        ? `In progress · ${a.remaining} min estimated remaining`
                        : a.ready
                          ? `${a.remaining} min estimate · Ready to start`
                          : "Waiting for readiness or prerequisites"}
                    </small>
                    <button
                      className="secondary full"
                      disabled={
                        busy || (!a.ready && a.task!.status !== "active")
                      }
                      onClick={() =>
                        a.task!.status === "active"
                          ? open({ kind: "complete", task: a.task! })
                          : action({
                              type: "progress",
                              taskId: a.task!.id,
                              operation:
                                a.task!.status === "paused"
                                  ? "resume"
                                  : "start",
                            })
                      }
                    >
                      {a.task!.status === "active"
                        ? "Report complete"
                        : "Start task"}{" "}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                ))}
              {late && (
                <button
                  className="secondary full"
                  disabled={busy}
                  onClick={() => action({ type: "recalculate" })}
                >
                  Review recovery options
                </button>
              )}
            </>
          )}
          <div className="decision-trust">
            <ShieldCheck size={16} />
            <span>
              {full.verification?.valid
                ? "Schedule checked. Your household decides."
                : "Review constraints before acting. Your household decides."}
            </span>
          </div>
        </aside>
        <section
          className="household-work"
          aria-label={tab === "Tasks" ? "Household task list" : tab}
        >
          {tab === "Tasks" && (
            <>
              <div className="household-panel-heading">
                <h2>
                  {recommended
                    ? "Your progress stays with you."
                    : "One plan. Shared progress."}
                </h2>
                <span>
                  {completed.length} / {s.tasks.length} reported complete
                </span>
              </div>
              <div className="household-task-list">
                {s.tasks.map((t) => (
                  <div key={t.id} className={"household-task " + t.status}>
                    <button
                      className="household-check"
                      disabled={
                        busy ||
                        ["completed", "deferred"].includes(t.status) ||
                        s.phase === "draft" ||
                        t.release > s.now ||
                        t.deps.some(
                          (id) =>
                            !["completed", "deferred"].includes(
                              s.tasks.find((x) => x.id === id)?.status ??
                                "pending",
                            ),
                        ) ||
                        (t.barrier &&
                          s.tasks.some(
                            (x) =>
                              x.id !== t.id &&
                              !["completed", "deferred"].includes(x.status),
                          ))
                      }
                      aria-label={`Report ${t.title} complete`}
                      onClick={() => open({ kind: "complete", task: t })}
                    >
                      {t.status === "completed" ? (
                        <Check size={18} />
                      ) : t.status === "deferred" ? (
                        <RotateCcw size={17} />
                      ) : t.status === "active" ? (
                        <Clock3 size={18} />
                      ) : null}
                    </button>
                    <button
                      className="household-task-title"
                      onClick={() => open({ kind: "task", task: t })}
                    >
                      <strong>{t.title}</strong>
                      <span>
                        {s.people.find((p) => p.id === t.owner)?.name} ·{" "}
                        {t.required ? "Essential" : "Flexible"}
                        {t.status === "completed"
                          ? ` · Reported ${fmt(t.completedAt, s)}`
                          : t.status === "deferred"
                            ? " · Saved, still unfinished"
                            : t.release > s.now
                              ? ` · Estimated ready ${fmt(t.release, s)}`
                              : ` · ${t.duration} min estimate`}
                      </span>
                    </button>
                    <div className="household-task-status">
                      <span>
                        {t.status === "completed"
                          ? "Completed"
                          : t.status === "deferred"
                            ? "For later"
                            : t.status === "active"
                              ? "In progress"
                              : t.status === "paused"
                                ? "Paused"
                                : t.release > s.now
                                  ? "Waiting"
                                  : "Pending"}
                      </span>
                      {s.phase === "active" &&
                        !["completed", "deferred"].includes(t.status) && (
                          <button
                            className="icon-button"
                            disabled={
                              busy ||
                              (t.status !== "active" &&
                                !s.nextActions.some(
                                  (a) => a.task?.id === t.id && a.ready,
                                ))
                            }
                            aria-label={`${t.status === "active" ? "Pause" : t.status === "paused" ? "Resume" : "Start"} ${t.title}`}
                            onClick={() =>
                              t.status === "active"
                                ? open({ kind: "pause", task: t })
                                : action({
                                    type: "progress",
                                    taskId: t.id,
                                    operation:
                                      t.status === "paused"
                                        ? "resume"
                                        : "start",
                                  })
                            }
                          >
                            {t.status === "active" ? (
                              <Pause size={16} />
                            ) : (
                              <Play size={16} />
                            )}
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
              {deferred.length > 0 && (
                <div className="household-saved">
                  <RotateCcw size={19} />
                  <div>
                    <strong>
                      Saved for later: {deferred.map((t) => t.title).join(", ")}
                    </strong>
                    <p>
                      The current plan covers the tasks you kept. Saved work is
                      still unfinished.
                    </p>
                    {!remaining.length && (
                      <button
                        className="text-button"
                        onClick={() =>
                          open({ kind: "resume", task: deferred[0] })
                        }
                      >
                        Resume with a new deadline <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          {tab === "Schedule" && (
            <>
              <div className="household-panel-heading">
                <h2>The checked schedule</h2>
                <span>Based on your estimates</span>
              </div>
              <Timeline s={s} />
              <p className="household-schedule-note">
                Passive waits and one task per person are checked. Passing time
                never completes physical work.
              </p>
            </>
          )}
          {tab === "History" && (
            <>
              <div className="household-panel-heading">
                <h2>What changed, and why</h2>
                <span>{s.events.length} saved events</span>
              </div>
              <ol className="household-history">
                {s.events.slice(-18).map((e) => (
                  <li key={e.id}>
                    <time>{fmt(e.at, s)}</time>
                    <p>{e.text}</p>
                  </li>
                ))}
              </ol>
              {!s.events.length && (
                <p className="household-schedule-note">
                  Your decisions and reported progress will appear here.
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
