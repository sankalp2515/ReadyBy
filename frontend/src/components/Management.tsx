import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Copy,
  Flag,
  Plus,
  Timer,
  Users,
  X,
} from "lucide-react";
import { api } from "../api";
import { getMcpStatus } from "../mcp-client";
import type { Bootstrap, Mission } from "../types";

import { Avatar, Field, PageTitle } from "./Shared";
import { fmt, type Dialog, type Run } from "../model";
export function Household({
  boot,
  run,
  busy,
  refresh,
  notice,
}: {
  boot: Bootstrap;
  run: Run;
  busy: boolean;
  refresh: () => Promise<void>;
  notice: (v: string) => void;
}) {
  const [code, setCode] = useState(""),
    [members, setMembers] = useState<
      { name: string; username: string; role: string }[]
    >([]),
    [households, setHouseholds] = useState<
      { id: string; name: string; role: string }[]
    >([]);
  const loadMembers = () =>
    api("household/members").then((r) => {
      setMembers(r.members);
      setHouseholds(r.households);
    });
  useEffect(() => {
    loadMembers().catch(() => {});
  }, [boot.household?.id]);
  const owner = boot.identity?.role === "owner";
  return (
    <>
      <PageTitle
        eyebrow="A SHARED PLAN STARTS WITH YOU"
        title="Your people. Your pace."
        text="One or two adults can share a mission. Account access is managed separately."
      />
      <div className="settings-grid">
        <section className="card padded">
          <h2>Household details</h2>
          {households.length > 1 && (
            <Field label="Active household">
              <select
                value={boot.household?.id}
                disabled={busy}
                onChange={(e) =>
                  run(async () => {
                    await api("household/switch", { id: e.target.value });
                    await refresh();
                  })
                }
              >
                {households.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} · {h.role}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run(async () => {
                await api(
                  "household",
                  {
                    name: f.get("name"),
                    names: [f.get("person1"), f.get("person2")].filter(Boolean),
                  },
                  "PATCH",
                );
                await refresh();
                notice(
                  "Household updated. New missions use these participant names.",
                );
              });
            }}
          >
            <Field label="Household name">
              <input
                name="name"
                defaultValue={boot.household?.name}
                required
                maxLength={60}
                disabled={!owner}
              />
            </Field>
            <div className="form-grid">
              <Field label="First adult">
                <input
                  name="person1"
                  defaultValue={boot.household?.people[0]}
                  required
                  maxLength={40}
                  disabled={!owner}
                />
              </Field>
              <Field label="Second adult (optional)">
                <input
                  name="person2"
                  defaultValue={boot.household?.people[1]}
                  maxLength={40}
                  disabled={!owner}
                />
              </Field>
            </div>
            <p className="muted small">
              Participant changes apply to new missions. Existing mission names
              remain attached to their saved history.
            </p>
            {owner && (
              <button className="primary" disabled={busy}>
                Save household <Check size={16} />
              </button>
            )}
          </form>
        </section>
        <section className="card padded">
          <h2>People with account access</h2>
          {members.map((m, i) => (
            <div className="member-row" key={m.username}>
              <Avatar name={m.name} index={i} />
              <div>
                <strong>{m.name}</strong>
                <small>
                  {m.role === "owner" ? "Household owner" : "Household member"}
                </small>
              </div>
              <span className="role-badge">{m.role}</span>
              {owner && m.role === "member" && (
                <button
                  className="icon-button"
                  aria-label={`Remove access for ${m.name}`}
                  onClick={() =>
                    run(async () => {
                      await api("household/remove-member", {
                        username: m.username,
                      });
                      await loadMembers();
                      notice("Household access removed.");
                    })
                  }
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
          <p className="muted small">
            Members can create and update missions. Only the owner manages
            household details, invitations, saved routines and deletion.
          </p>
        </section>
        <section className="card padded">
          <h2>Invite another adult</h2>
          <p className="muted">
            Create a single-use code, valid for seven days. Share it directly
            with an adult you trust. They can join after creating an account on
            this server.
          </p>
          {owner && !boot.identity?.guest ? (
            <button
              className="secondary"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const r = await api("household/invite", {});
                  setCode(r.code);
                })
              }
            >
              <Plus size={16} /> Create invitation
            </button>
          ) : (
            <p className="small muted">
              A permanent household owner account is required.
            </p>
          )}
          {code && (
            <div className="invite-result">
              <code>{code}</code>
              <button
                className="secondary"
                onClick={() =>
                  run(async () => {
                    await navigator.clipboard.writeText(code);
                    notice("Invitation copied.");
                  })
                }
              >
                <Copy size={15} /> Copy code
              </button>
            </div>
          )}
        </section>
        <section className="card padded">
          <h2>Join a household</h2>
          <p className="muted">
            Accept an invitation to work together. Your current session switches
            to that household.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run(async () => {
                await api("household/join", { code: f.get("code") });
                await refresh();
                notice("You joined the household.");
              });
            }}
          >
            <Field label="Invitation code">
              <input
                name="code"
                required
                maxLength={100}
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
            <button className="secondary" disabled={busy}>
              Join household <ArrowRight size={16} />
            </button>
          </form>
        </section>
      </div>
    </>
  );
}

export function Review({
  mission: s,
  runtime,
  busy,
  run,
  onChapter,
  openDemo,
  open,
}: {
  mission: Mission | null;
  runtime: { available: boolean; model: string; provider: string } | null;
  busy: boolean;
  run: Run;
  onChapter: (c: string) => Promise<void>;
  openDemo: () => void;
  open: (d: Dialog) => void;
}) {
  return (
    <>
      <PageTitle
        eyebrow="EVIDENCE BEHIND THE EXPERIENCE"
        title="A plan you can inspect."
        text="Live state, real tool calls and checked schedules. Rehearsal data is labeled."
      />
      <div className="review-stats">
        <div className="card">
          <span>AI interpreter</span>
          <strong>
            {runtime?.available ? runtime.provider : "Not configured"}
          </strong>
          <small>{runtime?.model ?? "Checking AI configuration…"}</small>
        </div>
        <div className="card">
          <span>Schedule verification</span>
          <strong>
            {s?.analysis.full.verification?.valid
              ? "Passed"
              : s
                ? "No valid schedule"
                : "No mission"}
          </strong>
          <small>
            {s
              ? `${s.analysis.full.visited} search states · ${s.analysis.full.optimizationComplete ? "Search complete" : "Bounded search"}`
              : "Create a mission to inspect it"}
          </small>
        </div>
        <div className="card">
          <span>Storage</span>
          <strong>Private household</strong>
          <small>SQLite transactions · revision checks</small>
        </div>
      </div>
      <section className="card padded" aria-label="Actual MCP connection">
        <h2>MCP connection</h2>
        <p>
          {getMcpStatus().connected
            ? `${getMcpStatus().protocol} · Streamable HTTP · ${getMcpStatus().toolCount} discovered tools`
            : "Connection has not completed."}
        </p>
        <p className="muted small">
          This browser is an MCP client. Household tools share the same checked
          state; consequential revisions require review.
        </p>
        <details>
          <summary>Inspect actual protocol requests</summary>
          <pre>{JSON.stringify(getMcpStatus().trace, null, 2)}</pre>
        </details>
      </section>
      <div className="card padded rehearsal-panel">
        <div>
          <span className="eyebrow">DEMONSTRATION CONTROLS</span>
          <h2>Set the scene. Then make a real request.</h2>
          <p className="muted">
            Chapters seed time and explicitly reported progress through the
            domain engine. They do not simulate an AI response. Type an
            unscripted request on Today to test live interpretation. Household
            display also supports local speech with transcript review.
          </p>
        </div>
        {s?.isDemo ? (
          <>
            <div className="chapter-buttons">
              {[
                ["opening", "1 · Morning plan"],
                ["delay", "2 · Washer disruption"],
                ["essential", "3 · Essential laundry"],
                ["return", "4 · Back home"],
              ].map(([id, label]) => (
                <button
                  className="secondary"
                  key={id}
                  disabled={busy}
                  onClick={() => run(() => onChapter(id))}
                >
                  {label} <ArrowRight size={14} />
                </button>
              ))}
            </div>
            <div className="review-controls">
              <button
                className="text-button"
                disabled={busy}
                onClick={() => open({ kind: "clock" })}
              >
                <Clock3 size={15} /> Advance demo clock
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => open({ kind: "availability" })}
              >
                <Users size={15} /> Report availability
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => open({ kind: "delay" })}
              >
                <Timer size={15} /> Report a delay
              </button>
            </div>
          </>
        ) : (
          <button className="primary" disabled={busy} onClick={openDemo}>
            Create a separate demo mission <Flag size={16} />
          </button>
        )}
      </div>
      {s && (
        <div className="evidence-grid">
          <section className="card padded">
            <h2>
              Actual tool receipts{" "}
              <span className="count">{s.receipts.length}</span>
            </h2>
            <p className="muted small">
              AI interpretation is distinct from a direct task control.
            </p>
            {s.receipts.length === 0 ? (
              <p className="muted">
                Send a request or use a task control to see the receipt.
              </p>
            ) : (
              s.receipts
                .slice()
                .reverse()
                .slice(0, 12)
                .map((r, i) => (
                  <details className="receipt" key={i}>
                    <summary>
                      <span
                        className={
                          "receipt-kind " + (r.kind === "ai" ? "ai" : "")
                        }
                      >
                        {String(r.kind).toUpperCase()}
                      </span>
                      <strong>{String(r.tool)}</strong>
                      <small>
                        {r.latencyMs
                          ? `${r.latencyMs} ms`
                          : `Revision ${r.revision}`}
                      </small>
                    </summary>
                    <pre>{JSON.stringify(r, null, 2)}</pre>
                  </details>
                ))
            )}
          </section>
          <section className="card padded">
            <h2>
              Mission history <span className="count">{s.events.length}</span>
            </h2>
            <div className="event-list">
              {s.events
                .slice()
                .reverse()
                .slice(0, 25)
                .map((e) => (
                  <div className="event" key={e.id}>
                    <span>{fmt(e.at, s)}</span>
                    <div>
                      <strong>{e.kind.replaceAll("_", " ")}</strong>
                      <p>{e.text}</p>
                    </div>
                  </div>
                ))}
            </div>
          </section>
          <section className="card padded evidence-wide">
            <h2>Current verified state</h2>
            <div className="review-facts">
              <span>
                Mission <code>{s.id.slice(0, 8)}</code>
              </span>
              <span>
                Revision <strong>{s.revision}</strong>
              </span>
              <span>
                Clock{" "}
                <strong>{s.isDemo ? "Seeded demo time" : "System time"}</strong>
              </span>
              <span>
                Result{" "}
                <strong>{s.analysis.full.status.replaceAll("_", " ")}</strong>
              </span>
            </div>
            <p>{s.summary}</p>
            <details>
              <summary>Inspect schedule and constraints</summary>
              <pre>
                {JSON.stringify(
                  {
                    people: s.people,
                    tasks: s.tasks,
                    analysis: s.analysis,
                    proposal: s.proposal,
                  },
                  null,
                  2,
                )}
              </pre>
            </details>
          </section>
        </div>
      )}
      <p className="review-disclosure">
        This is an Alexa+ simulator with a real MCP connection and configurable
        AI. There is no native Echo integration, sensor confirmation, push
        notification service or claim that estimates guarantee departure time.
      </p>
    </>
  );
}
