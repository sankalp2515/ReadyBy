import { useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Backpack,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Info,
  LoaderCircle,
  MessageCircle,
  MoreHorizontal,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
  X,
  AlertTriangle,
  BookOpen,
} from "lucide-react";

import type { Mission, Slot } from "../types";

import { Avatar } from "./Shared";
import { fmt, type Dialog } from "../model";
export function Workspace({
  mission: s,
  busy,
  action,
  command,
  open,
  runtime,
}: {
  mission: Mission;
  busy: boolean;
  action: (a: Record<string, unknown>) => Promise<boolean>;
  command: (t: string) => Promise<boolean>;
  open: (d: Dialog) => void;
  runtime: { available: boolean } | null;
}) {
  const completed = s.tasks.filter((t) => t.status === "completed").length,
    deferred = s.tasks.filter((t) => t.status === "deferred"),
    remaining = s.tasks.filter(
      (t) => !["completed", "deferred"].includes(t.status),
    ),
    full = s.analysis.full,
    late =
      full.finish === undefined
        ? undefined
        : Math.max(0, full.finish - s.deadline),
    options = s.proposal?.options ?? [],
    last = s.messages.filter((m) => m.role === "assistant").at(-1)?.text;
  const [history, setHistory] = useState(false);
  return (
    <div className="workspace-grid">
      <div className="mission-column">
        <section className="card mission-card">
          <div className="mission-top">
            <div className="mission-title">
              <span className="mission-icon">
                <Backpack size={24} />
              </span>
              <div>
                <h2>{s.title}</h2>
                <p>
                  {s.people.length === 1 ? "One adult" : "Two adults"} ·{" "}
                  {s.phase === "draft"
                    ? "Review your estimates"
                    : "Shared household plan"}
                </p>
              </div>
            </div>
            <span
              className={
                "status-badge " +
                (s.phase === "draft"
                  ? "neutral"
                  : options.length || late
                    ? "amber"
                    : "green")
              }
            >
              {s.phase === "draft" ? (
                <BookOpen size={14} />
              ) : options.length || late ? (
                <AlertTriangle size={14} />
              ) : (
                <CheckCircle2 size={14} />
              )}{" "}
              {s.phase === "draft"
                ? "Draft for review"
                : options.length
                  ? "A change needs your approval"
                  : !remaining.length
                    ? "Departure work complete"
                    : late
                      ? "Departure at risk"
                      : "On track with your estimates"}
            </span>
          </div>
          <div className="deadline-row">
            <div>
              <div className="deadline">{fmt(s.deadline, s)}</div>
              <span>
                {s.title === "Finish deferred work"
                  ? "new deadline"
                  : s.goalKind === "readiness"
                    ? "ready by"
                    : "departure"}
              </span>
            </div>
            <div className="finish-metric">
              <span>
                {remaining.length ? "Planned finish" : "Reported finish"}
              </span>
              <strong>{fmt(full.finish, s)}</strong>
              <small className={late ? "late-text" : ""}>
                {full.status === "unknown_search_limit"
                  ? "Search limit · no feasibility conclusion"
                  : late
                    ? `${late} min after the deadline`
                    : full.finish !== undefined
                      ? `${Math.max(0, s.deadline - full.finish)} min of planned buffer`
                      : "Review availability"}
              </small>
            </div>
          </div>
          {deferred.length > 0 && (
            <div className="saved-work-notice" role="status">
              <RotateCcw size={19} />
              <div>
                <strong>
                  Saved for later: {deferred.map((t) => t.title).join(", ")}
                </strong>
                <p>
                  The {fmt(s.deadline, s)} plan covers the tasks you kept. Saved
                  work is still unfinished.
                </p>
              </div>
            </div>
          )}
          {!!options.length && (
            <div className="recovery-panel">
              <span className="eyebrow">LET’S MAKE ROOM</span>
              <h3>How should we help you recover?</h3>
              <p>
                {full.status === "infeasible_proven" &&
                options.every((o) => o.kind === "later")
                  ? `Essential work stays in the plan. The current estimates miss ${fmt(s.deadline, s)}.`
                  : "Choose what matters now. Nothing changes until you approve."}
              </p>
              <div className="recovery-options">
                {options.map((o, i) => (
                  <div
                    className={
                      "recovery-option " + (i === 0 ? "recommended" : "")
                    }
                    key={o.id}
                  >
                    <div className="option-heading">
                      <span className="option-symbol">
                        {o.kind === "defer" ? (
                          <ArrowUpRight size={22} />
                        ) : o.kind === "reassign" ? (
                          <Users size={22} />
                        ) : (
                          <Clock3 size={22} />
                        )}
                      </span>
                      <div>
                        <h4>
                          {o.kind === "later"
                            ? `${s.goalKind === "readiness" ? "Ready" : "Leave"} ${fmt(o.deadline, s)}`
                            : o.kind === "reassign"
                              ? "Share the work differently"
                              : `Keep ${fmt(s.deadline, s)}`}
                        </h4>
                        <p>
                          {o.kind === "defer"
                            ? `Save ${o.deferred.map((id) => s.tasks.find((t) => t.id === id)?.title.toLowerCase()).join(" & ")} for later`
                            : o.kind === "reassign"
                              ? "Approve a new task allocation"
                              : "Finish every retained task"}
                        </p>
                      </div>
                    </div>
                    <div className="option-finish">
                      Finish {fmt(o.finish, s)}{" "}
                      <span>
                        · {Math.max(0, o.deadline - o.finish)} min buffer
                      </span>
                    </div>
                    <button
                      className={i === 0 ? "primary full" : "secondary full"}
                      disabled={busy}
                      onClick={() => open({ kind: "approve", option: o })}
                    >
                      {o.kind === "later"
                        ? "Review later departure"
                        : o.kind === "reassign"
                          ? "Review allocation"
                          : "Review this plan"}{" "}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="text-button reject"
                disabled={busy}
                onClick={() => action({ type: "reject" })}
              >
                Keep current commitments
              </button>
            </div>
          )}
          {s.phase === "active" &&
            !options.length &&
            (late || full.status === "unknown_search_limit") && (
              <div className="constraint-notice">
                <AlertTriangle size={20} />
                <div>
                  <strong>
                    {late
                      ? "The current plan runs past departure."
                      : "We could not establish an on-time plan."}
                  </strong>
                  <p>
                    {full.status === "unknown_search_limit"
                      ? "The search limit is not proof that your deadline is impossible."
                      : "Required work is protected. Review availability or ask for new recovery options."}
                  </p>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => action({ type: "recalculate" })}
                  >
                    Calculate fresh options <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            )}
          {!remaining.length && (
            <div className="success-strip">
              <CheckCheck size={24} />
              <div>
                <strong>You’ve finished the departure work.</strong>
                <p>
                  {deferred.length
                    ? "The rest is saved for when you’re ready."
                    : "Every task is explicitly reported complete."}
                </p>
              </div>
            </div>
          )}
          {options.length ? (
            <details className="timeline-disclosure">
              <summary>
                Inspect the full plan · planned finish {fmt(full.finish, s)}
              </summary>
              <Timeline s={s} />
            </details>
          ) : (
            <Timeline s={s} />
          )}
          {s.phase === "draft" && (
            <div className="draft-approval">
              <div>
                <strong>Your estimates. Your priorities.</strong>
                <p>
                  Check the tasks below. Starting approves the proposed
                  allocation.
                </p>
              </div>
              <button
                className="primary"
                disabled={busy}
                onClick={() => action({ type: "start_mission" })}
              >
                Start this mission <Play size={16} />
              </button>
            </div>
          )}
        </section>
        <Composer
          busy={busy}
          send={command}
          disabled={!runtime?.available}
          draft={s.phase === "draft"}
        />
        <section className="card task-card">
          <div className="section-card-heading">
            <div>
              <h3>
                {s.phase === "draft"
                  ? "Make the plan yours"
                  : "Your shared checklist"}
              </h3>
              <p>
                {s.phase === "draft"
                  ? "Minutes are estimates. Edit them before you begin."
                  : "A task is complete only when you report it."}
              </p>
            </div>
            <button
              className="icon-button"
              title="Mission options"
              aria-label="Mission options"
              onClick={() => open({ kind: "mission-options" })}
            >
              <MoreHorizontal size={21} />
            </button>
          </div>
          <div className="task-list">
            {s.tasks
              .filter((t) => t.status !== "deferred")
              .map((t) => (
                <div
                  className={
                    "task-row " + (t.status === "completed" ? "completed" : "")
                  }
                  key={t.id}
                >
                  <button
                    className={
                      "task-check " +
                      (t.status === "completed" ? "checked" : "")
                    }
                    disabled={
                      busy || t.status === "completed" || s.phase === "draft"
                    }
                    aria-label={`Report ${t.title} complete`}
                    onClick={() => open({ kind: "complete", task: t })}
                  >
                    {t.status === "completed" ? (
                      <Check size={16} />
                    ) : t.status === "active" ? (
                      <span className="active-dot" />
                    ) : null}
                  </button>
                  <button
                    className="task-name"
                    onClick={() => open({ kind: "task", task: t })}
                  >
                    <strong>{t.title}</strong>
                    <span>
                      {s.people.find((p) => p.id === t.owner)?.name}{" "}
                      <span className="separator">·</span>{" "}
                      {t.status === "completed"
                        ? `Reported ${fmt(t.completedAt, s)}`
                        : t.status === "active"
                          ? "In progress"
                          : t.status === "paused"
                            ? "Paused"
                            : `${t.duration} min`}
                      {t.release > s.now && t.status !== "completed"
                        ? ` · Ready ${fmt(t.release, s)}`
                        : ""}
                    </span>
                  </button>
                  {t.required ? (
                    <span className="essential-label">Essential</span>
                  ) : (
                    <span className="flexible-label">Flexible</span>
                  )}
                  {s.phase === "active" &&
                    ["pending", "paused", "active"].includes(t.status) && (
                      <button
                        className="icon-button task-play"
                        disabled={busy}
                        title={
                          t.status === "active"
                            ? "Pause task"
                            : t.status === "paused"
                              ? "Resume task"
                              : "Start task"
                        }
                        aria-label={`${t.status === "active" ? "Pause" : t.status === "paused" ? "Resume" : "Start"} ${t.title}`}
                        onClick={() =>
                          t.status === "active"
                            ? open({ kind: "pause", task: t })
                            : action({
                                type: "progress",
                                taskId: t.id,
                                operation:
                                  t.status === "paused" ? "resume" : "start",
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
                  <button
                    className="icon-button"
                    aria-label={`Edit ${t.title}`}
                    onClick={() => open({ kind: "task", task: t })}
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              ))}
          </div>
        </section>
        {deferred.length > 0 && (
          <section className="card deferred-card">
            <div className="section-card-heading">
              <div>
                <div className="eyebrow">SAVED, NOT FORGOTTEN</div>
                <h3>For when you’re back.</h3>
                <p>Resume with a fresh deadline and confirmed readiness.</p>
              </div>
              <RotateCcw size={23} />
            </div>
            {deferred.map((t) => (
              <div className="list-row" key={t.id}>
                <span className="square-icon">
                  <Timer size={21} />
                </span>
                <div>
                  <strong>{t.title}</strong>
                  <small>
                    {t.duration} min ·{" "}
                    {s.people.find((p) => p.id === t.owner)?.name}
                  </small>
                </div>
                <button
                  className="secondary"
                  disabled={busy || remaining.length > 0}
                  onClick={() => open({ kind: "resume", task: t })}
                >
                  Resume <ArrowRight size={15} />
                </button>
              </div>
            ))}
          </section>
        )}
      </div>
      <aside className="context-column">
        <section className="card next-card">
          <div className="section-card-heading">
            <h3>Your next moves</h3>
            <span className="live-dot" />
          </div>
          {s.nextActions.map((a, i) => (
            <div className="next-person" key={a.person.id}>
              <div className="person-heading">
                <Avatar name={a.person.name} index={i} />
                <div>
                  <strong>{a.person.name}</strong>
                  <span>
                    {a.task?.status === "active"
                      ? "In progress"
                      : s.phase === "draft"
                        ? "Planned next"
                        : "Next up"}
                  </span>
                </div>
              </div>
              <h4>{a.task?.title ?? "All clear for now"}</h4>
              <p>
                {a.task
                  ? `${a.remaining} min${!a.ready ? " · Waiting on a prerequisite or availability" : ""}`
                  : "No remaining tasks are assigned to you."}
              </p>
              {a.task && s.phase === "active" && (
                <button
                  className="next-action"
                  disabled={busy || !a.ready}
                  onClick={() =>
                    a.task!.status === "active"
                      ? open({ kind: "complete", task: a.task! })
                      : action({
                          type: "progress",
                          taskId: a.task!.id,
                          operation:
                            a.task!.status === "paused" ? "resume" : "start",
                        })
                  }
                >
                  {a.task.status === "active"
                    ? "Report complete"
                    : a.task.status === "paused"
                      ? "Resume task"
                      : "Start task"}{" "}
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          ))}
        </section>
        <section className="card response-card">
          <h3>
            <Sparkles size={19} /> ReadyBy’s response
          </h3>
          <p>{last ?? s.summary}</p>
          <button className="text-button" onClick={() => setHistory(!history)}>
            <MessageCircle size={14} />{" "}
            {history ? "Hide conversation" : "View conversation"}{" "}
            <ChevronDown size={13} />
          </button>
          {history && (
            <div className="conversation">
              {s.messages.slice(-12).map((m, i) => (
                <div className={"message " + m.role} key={i}>
                  <small>{m.role === "user" ? "You" : "ReadyBy"}</small>
                  <p>{m.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="card progress-card">
          <div className="progress-title">
            <h3>Plan progress</h3>
            <span>
              {completed} / {s.tasks.length}
            </span>
          </div>
          <progress
            value={completed}
            max={s.tasks.length}
            aria-label={`${completed} of ${s.tasks.length} tasks complete`}
          />
          <p>
            {completed === 0
              ? "A fresh start. Take the next small step."
              : `${completed} task${completed === 1 ? "" : "s"} reported complete.${deferred.length ? ` ${deferred.length} saved for later.` : ""}`}
          </p>
          <div className="progress-legend">
            <span>
              <i className="legend-dot green-dot" /> Complete
            </span>
            <span>
              <i className="legend-dot blue-dot" /> Planned
            </span>
          </div>
        </section>
        <div className="quiet-note">
          <ShieldCheck size={17} />
          <p>
            ReadyBy proposes changes.
            <br />
            Your household decides.
          </p>
        </div>
      </aside>
    </div>
  );
}

export function Timeline({ s }: { s: Mission }) {
  const slots = s.analysis.full.schedule ?? [],
    end = Math.max(s.deadline, s.now + 1, ...slots.map((x) => x.end)),
    start = Math.min(s.start, s.now),
    span = Math.max(1, end - start),
    pct = (n: number) => `${((n - start) / span) * 100}%`,
    ticks = Array.from({ length: 5 }, (_, i) =>
      Math.round(start + (span * i) / 4),
    );
  return (
    <div className="timeline" aria-label="Calculated household timeline">
      <div className="timeline-scroll">
        <div className="timeline-inner">
          <div className="timeline-axis">
            <span />
            {ticks.map((n, i) => (
              <span key={i} style={{ left: pct(n) }}>
                {fmt(n, s)}
              </span>
            ))}
          </div>
          <div className="timeline-lanes">
            <div
              className="timeline-marker deadline-marker"
              style={{
                left: `calc(80px + (100% - 80px) * ${(s.deadline - start) / span})`,
              }}
            >
              <span>
                {s.goalKind === "readiness" ? "Ready by" : "Departure"}
              </span>
            </div>
            {s.now >= start && s.now <= end && (
              <div
                className="timeline-marker now-marker"
                style={{
                  left: `calc(80px + (100% - 80px) * ${(s.now - start) / span})`,
                }}
              >
                <span>Now {fmt(s.now, s)}</span>
              </div>
            )}
            {s.people.map((p, i) => (
              <div className="timeline-lane" key={p.id}>
                <div className="lane-person">
                  <Avatar name={p.name} index={i} />
                  <span>{p.name}</span>
                </div>
                <div className="lane-track">
                  {slots
                    .filter((x) => x.personId === p.id)
                    .map((x: Slot) => {
                      const t = s.tasks.find((t) => t.id === x.taskId)!;
                      return x.end === x.start ? (
                        <span
                          key={x.taskId}
                          className="completed-pin"
                          style={{ left: pct(x.end) }}
                          title={`${t.title}: reported ${fmt(x.end, s)}`}
                        >
                          <Check size={11} />
                        </span>
                      ) : (
                        <div
                          key={x.taskId}
                          className={
                            "time-block " +
                            (x.completed
                              ? "done"
                              : x.active
                                ? "in-progress"
                                : x.end > s.deadline
                                  ? "late"
                                  : "planned")
                          }
                          style={{
                            left: pct(x.start),
                            width: `${Math.max(0.3, ((x.end - x.start) / span) * 100)}%`,
                          }}
                          title={`${t.title} · ${fmt(x.start, s)}–${fmt(x.end, s)}`}
                        >
                          <span>
                            {x.completed ? (
                              <Check size={11} />
                            ) : x.active ? (
                              <Play size={10} />
                            ) : (
                              <Clock3 size={10} />
                            )}{" "}
                            {t.title}
                          </span>
                          <small>
                            {fmt(x.start, s)}–{fmt(x.end, s)}
                          </small>
                        </div>
                      );
                    })}
                  {!slots.some((x) => x.personId === p.id) && (
                    <span className="empty-lane">No scheduled work</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="timeline-caption">
        <span>
          <i className="legend-dot blue-dot" /> Calculated plan
        </span>
        <span>Estimates update when you report a change.</span>
      </div>
    </div>
  );
}

function Composer({
  busy,
  send,
  disabled,
  draft,
}: {
  busy: boolean;
  send: (text: string) => Promise<boolean>;
  disabled: boolean;
  draft: boolean;
}) {
  const [text, setText] = useState(""),
    [tip, setTip] = useState(false);
  return (
    <div className="composer-wrap">
      <form
        className="composer card"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim() || busy) return;
          const submitted = text;
          if (await send(submitted)) setText("");
        }}
      >
        <Sparkles size={22} className="composer-spark" />
        <input
          aria-label="Tell ReadyBy what changed"
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            disabled
              ? "AI is unavailable. Task controls are still available."
              : draft
                ? "Tell ReadyBy how to change the plan…"
                : "Tell ReadyBy what changed…"
          }
          disabled={busy || disabled}
        />
        <button
          type="button"
          className="icon-button"
          aria-label="Voice availability"
          title="Voice availability"
          onClick={() => setTip(!tip)}
        >
          <Info size={21} />
        </button>
        <button
          className="send-button"
          aria-label="Send to ReadyBy"
          disabled={busy || disabled || !text.trim()}
        >
          {busy ? (
            <LoaderCircle className="spin" size={20} />
          ) : (
            <ArrowUp size={22} />
          )}
        </button>
      </form>
      {tip && (
        <div className="composer-tip">
          <Info size={16} />
          <span>
            This workspace uses typed conversation with the configured AI. Open Household
            display for optional local microphone input and spoken replies. The
            native Alexa+ connection remains simulated.
          </span>
          <button
            className="icon-button"
            aria-label="Close voice information"
            onClick={() => setTip(false)}
          >
            <X size={14} />
          </button>
        </div>
      )}
      <div className="composer-caption">
        {disabled
          ? "Check the server AI configuration to use conversation."
          : "Describe the change in your own words. ReadyBy checks the plan before proposing a revision."}
      </div>
    </div>
  );
}
