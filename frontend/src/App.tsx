import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Backpack,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  Flag,
  Home,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Users,
  X,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { api, ApiError, requestKey, setCsrf } from "./api";
import type { Bootstrap, Mission } from "./types";

import { fmt, type Route, type Dialog, type Run } from "./model";
import { Avatar, Brand, Empty, Modal, PageTitle } from "./components/Shared";
import { Auth } from "./components/Auth";
import { Workspace } from "./components/Workspace";
import { Household, Review } from "./components/Management";
import { MissionDialog } from "./components/MissionDialog";
import { HouseholdDisplay } from "./components/HouseholdDisplay";
import { Landing, PrivacyContent } from "./components/Landing";
import type { VoiceResult } from "./components/LiveVoice";
const icons = {
  Today: Home,
  Routines: RotateCcw,
  Household: Users,
  Settings: Settings2,
};
export default function App() {
  const [boot, setBoot] = useState<Bootstrap | null>(null),
    [mission, setMission] = useState<Mission | null>(null),
    [route, setRoute] = useState<Route>("Today"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [dialog, setDialog] = useState<Dialog | null>(null),
    [menu, setMenu] = useState(false),
    [recovery, setRecovery] = useState("");
  const [householdView, setHouseholdView] = useState(true);
  const [productHome, setProductHome] = useState(false),
    [privacy, setPrivacy] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [route, boot?.identity?.username]);
  const [runtime, setRuntime] = useState<{
    available: boolean;
    model: string;
    provider: string;
  } | null>(null);
  async function refresh() {
    const b = await api<Bootstrap>("bootstrap");
    const r = b.identity
      ? await api<{ state: Mission | null }>("state")
      : { state: null };
    setCsrf(b.csrfToken);
    setBoot(b);
    setMission(r.state);
  }
  const run: Run = async (fn) => {
    if (busy) return false;
    setBusy(true);
    setError("");
    try {
      await fn();
      return true;
    } catch (e) {
      const x = e as ApiError;
      setError(
        x.message +
          (x.requestId ? ` · Reference ${x.requestId.slice(0, 8)}` : ""),
      );
      if (x.status === 401 || x.status === 409) await refresh().catch(() => {});
      return false;
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!boot?.identity) return;
    let alive = true;
    const check = () =>
      api("runtime")
        .then((r) => {
          if (alive) setRuntime(r);
        })
        .catch(() => {});
    check();
    const timer = setInterval(check, 30000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [boot?.identity?.username]);
  useEffect(() => {
    if (!boot?.identity || busy) return;
    const id = window.setInterval(() => {
      api<{ state: Mission | null }>("state")
        .then((r) => setMission(r.state))
        .catch(() => {});
    }, 15000);
    return () => clearInterval(id);
  }, [boot?.identity?.username, busy]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(id);
  }, [notice]);
  async function action(input: Record<string, unknown>) {
    if (!mission) return;
    const r = await api("action", {
      ...input,
      missionId: mission.id,
      expectedRevision: mission.revision,
      idempotencyKey: requestKey(),
    });
    setMission(r.state);
    await refresh();
  }
  async function command(text: string) {
    if (!mission) return;
    const r = await api("command", {
      text,
      missionId: mission.id,
      expectedRevision: mission.revision,
      idempotencyKey: requestKey(),
    });
    setMission(r.state);
    if (r.reviewProposalId) {
      const option = r.state.proposal?.options.find(
        (o: { id: string }) => o.id === r.reviewProposalId,
      );
      if (option) setDialog({ kind: "approve", option });
    }
    await refresh();
    return r;
  }
  async function auth(path: string, body: unknown) {
    const b = await api<Bootstrap>("auth/" + path, body);
    setCsrf(b.csrfToken);
    if (b.recoveryCode) setRecovery(b.recoveryCode);
    await refresh();
  }
  const close = () => setDialog(null);
  const nav = (r: Route) => {
    setRoute(r);
    setMenu(false);
  };
  async function voiceCommand(text: string): Promise<VoiceResult> {
    let reply = "";
    const ok = await run(async () => {
      const r = await command(text);
      reply = r?.reply ?? "No mission is open. Please open a mission.";
    });
    return {
      ok,
      reply: ok
        ? reply
        : "That request could not be verified. Your current plan is displayed; please retry or type below.",
    };
  }
  function scenario(chapter: string) {
    void run(async () => {
      if (!mission) return;
      const r = await api("demo/scenario", {
        scenario: chapter,
        missionId: mission.id,
        expectedRevision: mission.revision,
        idempotencyKey: requestKey(),
      });
      setMission(r.state);
      await refresh();
    });
  }
  if (!boot)
    return (
      <div className="boot">
        <Brand />
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button onClick={() => location.reload()}>Try again</button>
          </>
        ) : (
          <>
            <LoaderCircle className="spin" />
            <p>Opening your workspace…</p>
          </>
        )}
      </div>
    );
  if (!boot.identity)
    return (
      <>
        <Auth onAuth={(p, b) => run(() => auth(p, b))} busy={busy} />
        {error && (
          <div className="toast error" role="alert">
            <AlertTriangle size={20} />
            <span>{error}</span>
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={18} />
            </button>
          </div>
        )}
      </>
    );
  if (productHome)
    return (
      <Landing
        returning
        busy={busy}
        onDemo={() => {
          setProductHome(false);
          nav("Today");
        }}
        onSignup={() => setProductHome(false)}
        onLogin={() => setProductHome(false)}
      />
    );
  return (
    <div
      className={
        "app-shell " +
        (householdView && route === "Today" && mission ? "household-mode" : "")
      }
    >
      <aside
        id="workspace-navigation"
        className={"sidebar " + (menu ? "open" : "")}
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            className="mobile-only icon-button"
            aria-label="Close navigation"
            onClick={() => setMenu(false)}
          >
            <X />
          </button>
        </div>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {(Object.keys(icons) as (keyof typeof icons)[]).map((r) => {
            const Icon = icons[r];
            return (
              <button
                key={r}
                className={route === r ? "nav active" : "nav"}
                onClick={() => nav(r)}
              >
                <Icon size={20} />
                {r}
                {r === "Today" && mission && <span className="nav-dot" />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <span className="note-orbit">
            <Sparkles size={23} />
          </span>
          <strong>A little less to carry.</strong>
          <p>
            Share the work.
            <br />
            Keep the moment.
          </p>
        </div>
        <button className="household-switch" onClick={() => nav("Household")}>
          <Avatar name={boot.identity.displayName} />
          <span>
            <strong>{boot.household?.name}</strong>
            <small>
              <LockKeyhole size={11} /> Private workspace
            </small>
          </span>
          <ChevronRight size={15} />
        </button>
      </aside>
      {menu && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-only icon-button"
              aria-label="Open navigation"
              aria-controls="workspace-navigation"
              aria-expanded={menu}
              onClick={() => setMenu(true)}
            >
              <Menu />
            </button>
            <button
              className="workspace-brand"
              aria-label="ReadyBy product home"
              onClick={() => setProductHome(true)}
            >
              {householdView && route === "Today" && mission
                ? "ReadyBy"
                : "Workspace"}
            </button>
            <ChevronRight size={14} />
            <strong>{route === "Review" ? "System review" : route}</strong>
          </div>
          <div className="top-actions">
            <button className="quiet-button" onClick={() => setPrivacy(true)}>
              Privacy & help
            </button>
            {mission && (
              <button
                className="quiet-button view-switch"
                onClick={() => {
                  setHouseholdView(!householdView);
                  nav("Today");
                }}
              >
                {householdView ? "Full workspace" : "Household display"}
              </button>
            )}
            {mission?.isDemo && (
              <span className="demo-label">
                <Flag size={14} /> Demo mission
              </span>
            )}
            <button
              className="quiet-button"
              onClick={() => nav(route === "Review" ? "Today" : "Review")}
            >
              <ShieldCheck size={15} />
              <span>
                {route === "Review" ? "Back to today" : "Review system"}
              </span>
            </button>
            <Avatar name={boot.identity.displayName} index={1} />
          </div>
        </header>
        <div className="page-content">
          {route === "Today" && (
            <>
              <div
                className={
                  "page-heading " + (mission?.proposal ? "focused-heading" : "")
                }
              >
                <div>
                  <div className="eyebrow">MAKE ROOM FOR WHAT MATTERS</div>
                  <h1>A calmer way out the door.</h1>
                  <p>One deadline. A plan that moves with you.</p>
                </div>
                <button
                  className="secondary"
                  onClick={() => setDialog({ kind: "new" })}
                >
                  <Plus size={17} /> New mission
                </button>
              </div>
              {(boot.missions?.filter((m) => !m.archived).length ?? 0) > 1 && (
                <div className="mission-switch">
                  <label htmlFor="mission-select">Current mission</label>
                  <select
                    id="mission-select"
                    value={mission?.id ?? ""}
                    disabled={busy}
                    onChange={(e) =>
                      run(async () => {
                        await api("missions/select", {
                          missionId: e.target.value,
                        });
                        await refresh();
                      })
                    }
                  >
                    {boot.missions
                      ?.filter((m) => !m.archived)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                          {m.isDemo ? " · Demo" : ""} · {m.completed}/{m.total}{" "}
                          done
                        </option>
                      ))}
                  </select>
                </div>
              )}
              {mission ? (
                householdView ? (
                  <HouseholdDisplay
                    mission={mission}
                    busy={busy}
                    action={(a) => run(() => action(a))}
                    command={(text) =>
                      run(async () => {
                        await command(text);
                      })
                    }
                    voiceCommand={voiceCommand}
                    scenario={scenario}
                    open={setDialog}
                    setup={() => setHouseholdView(false)}
                    runtime={runtime}
                  />
                ) : (
                  <Workspace
                    mission={mission}
                    busy={busy}
                    action={(a) => run(() => action(a))}
                    command={(text) =>
                      run(async () => {
                        await command(text);
                      })
                    }
                    open={setDialog}
                    runtime={runtime}
                  />
                )
              ) : (
                <div className="card welcome-card">
                  <Empty
                    icon={Sun}
                    title="Your next departure starts here."
                    text="Choose a routine, check the estimates, and share the work. ReadyBy will help you adapt when something changes."
                  >
                    <button
                      className="primary"
                      onClick={() => setDialog({ kind: "new" })}
                    >
                      <Plus size={18} /> Create your first mission
                    </button>
                  </Empty>
                  <div className="starter-grid">
                    {boot.templates.map((t) => (
                      <button
                        key={t.id}
                        className="starter"
                        onClick={() =>
                          run(async () => {
                            await api("missions", {
                              templateId: t.id,
                              mode: "realtime",
                            });
                            await refresh();
                          })
                        }
                      >
                        <span className="template-icon">
                          {t.id === "school" ? (
                            <Backpack />
                          ) : t.id === "guests" ? (
                            <Sparkles />
                          ) : (
                            <Sun />
                          )}
                        </span>
                        <strong>{t.name}</strong>
                        <small>
                          {t.taskCount} editable tasks · {t.minutes} min
                        </small>
                        <ArrowUpRight size={19} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {route === "Routines" && (
            <>
              <PageTitle
                eyebrow="LESS PLANNING, MORE LIVING"
                title="A good rhythm, ready to repeat."
                text="Start with a template. Make it your household's own."
              />
              <div className="routine-grid">
                {boot.templates.map((t) => (
                  <article className="card routine" key={t.id}>
                    <div className={"routine-art art-" + t.id}>
                      {t.id === "school" ? (
                        <Backpack size={60} />
                      ) : t.id === "guests" ? (
                        <Sparkles size={60} />
                      ) : (
                        <Sun size={60} />
                      )}
                      <span>
                        {t.id === "school"
                          ? "01"
                          : t.id === "guests"
                            ? "02"
                            : "03"}
                      </span>
                    </div>
                    <div className="routine-body">
                      <span className="eyebrow">HOUSEHOLD TEMPLATE</span>
                      <h2>{t.name}</h2>
                      <p>{t.description}</p>
                      <div className="routine-meta">
                        <Clock3 size={15} /> {t.minutes} min <span>·</span>{" "}
                        {t.taskCount} tasks
                      </div>
                      <button
                        className="secondary full"
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            await api("missions", {
                              templateId: t.id,
                              mode: "realtime",
                            });
                            await refresh();
                            nav("Today");
                          })
                        }
                      >
                        Use this routine <ArrowRight size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="section-heading">
                <h2>Made for your household</h2>
                <p>
                  Save a mission draft to keep your estimates and priorities.
                </p>
              </div>
              {boot.routines?.length ? (
                <div className="card">
                  {boot.routines.map((r) => (
                    <div className="list-row" key={r.id}>
                      <span className="square-icon">
                        <RotateCcw />
                      </span>
                      <div>
                        <strong>{r.name}</strong>
                        <small>
                          {r.taskSpecs.length} tasks · {r.minutes} minutes
                        </small>
                      </div>
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            await api("routines/start", {
                              id: r.id,
                              mode: "realtime",
                            });
                            await refresh();
                            nav("Today");
                          })
                        }
                      >
                        Start draft <ArrowRight size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card compact-empty">
                  <BookOpen size={25} />
                  <p>Your saved routines will appear here.</p>
                  <button
                    className="text-button"
                    onClick={() => setDialog({ kind: "new" })}
                  >
                    Create a mission <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </>
          )}
          {route === "Household" && (
            <Household
              boot={boot}
              run={run}
              busy={busy}
              refresh={refresh}
              notice={setNotice}
            />
          )}
          {route === "Settings" && (
            <>
              <PageTitle
                eyebrow="YOUR WORKSPACE, YOUR CONTROL"
                title="Make yourself at home."
                text="Manage your account and household data."
              />
              <div className="settings-grid">
                <section className="card padded">
                  <h2>Account</h2>
                  <div className="profile-block">
                    <Avatar name={boot.identity.displayName} />
                    <div>
                      <strong>{boot.identity.displayName}</strong>
                      <small>
                        {boot.identity.guest
                          ? "Private demo guest"
                          : boot.identity.username}{" "}
                        · {boot.identity.role}
                      </small>
                    </div>
                  </div>
                  <p className="muted">
                    {boot.identity.guest
                      ? "This guest session is stored on this device’s ReadyBy server. Create a permanent account after signing out to keep a sign-in and recovery code."
                      : "Your passphrase is hashed. Save the recovery code from account setup to recover access without email."}
                  </p>
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        await api("auth/logout", {});
                        await refresh();
                      })
                    }
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </section>
                <section className="card padded">
                  <h2>Your data</h2>
                  <p className="muted">
                    Download your household, missions and routines as a JSON
                    file.
                  </p>
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        const data = await api("household/export");
                        const u = URL.createObjectURL(
                          new Blob([JSON.stringify(data, null, 2)], {
                            type: "application/json",
                          }),
                        );
                        const a = document.createElement("a");
                        a.href = u;
                        a.download = "readyby-household.json";
                        a.click();
                        URL.revokeObjectURL(u);
                        setNotice("Your household export is ready.");
                      })
                    }
                  >
                    <Download size={16} /> Export household
                  </button>
                </section>
                <section className="card padded">
                  <h2>About this build</h2>
                  <p className="muted">ReadyBy 0.3 · Private beta</p>
                  <p className="muted">
                    Alexa+ web simulation. Voice on a native Echo, device
                    control and appliance telemetry are not connected. Requests
                    use the configured AI provider and real MCP tools. Speech
                    recognition stays local.
                  </p>
                  <button className="text-button" onClick={() => nav("Review")}>
                    Inspect the working system <ArrowRight size={15} />
                  </button>
                </section>
                {boot.identity.role === "owner" && (
                  <section className="card padded danger-zone">
                    <h2>Delete household</h2>
                    <p className="muted">
                      Permanently remove this household, its missions, routines
                      and invitations from this server.
                    </p>
                    <button
                      className="danger-button"
                      onClick={() => setDialog({ kind: "delete" })}
                    >
                      <Trash2 size={16} /> Delete household
                    </button>
                  </section>
                )}
              </div>
            </>
          )}
          {route === "Review" && (
            <Review
              mission={mission}
              runtime={runtime}
              busy={busy}
              run={run}
              onChapter={async (scenario) => {
                if (!mission) return;
                const r = await api("demo/scenario", {
                  scenario,
                  missionId: mission.id,
                  expectedRevision: mission.revision,
                  idempotencyKey: requestKey(),
                });
                setMission(r.state);
                setNotice(
                  "Rehearsal chapter loaded. Seeded time and progress are labeled.",
                );
              }}
              openDemo={() =>
                run(async () => {
                  await api("missions", { templateId: "school", mode: "demo" });
                  await refresh();
                  setNotice(
                    "Demo draft created. Start it or load a rehearsal chapter.",
                  );
                })
              }
              open={setDialog}
            />
          )}
        </div>
        <footer className="app-footer">
          <span>
            <LockKeyhole size={12} /> Private household workspace
          </span>
          <span>
            Alexa+ web simulation
            {mission
              ? ` · ${mission.isDemo ? "Demo" : "Live"} time ${fmt(mission.now, mission)}`
              : ""}
          </span>
        </footer>
      </main>
      {dialog && (
        <MissionDialog
          error={error}
          dialog={dialog}
          mission={mission}
          boot={boot}
          busy={busy}
          close={close}
          run={run}
          action={action}
          refresh={refresh}
          notice={setNotice}
          onDeleted={async () => {
            await refresh();
            nav("Today");
          }}
        />
      )}
      {recovery && (
        <Modal
          title="Keep your recovery code safe."
          close={() => setRecovery("")}
          busy={false}
        >
          <div className="modal-body">
            <p>
              You’ll need this code if you forget your passphrase. ReadyBy
              cannot email a reset link. This code is shown only now.
            </p>
            <code className="recovery-code">{recovery}</code>
            <button
              className="secondary full"
              onClick={() =>
                navigator.clipboard
                  .writeText(recovery)
                  .then(() => setNotice("Recovery code copied."))
                  .catch(() =>
                    setError(
                      "Copy is unavailable. Select and save the recovery code.",
                    ),
                  )
              }
            >
              <Copy size={16} /> Copy recovery code
            </button>
            <button className="primary full" onClick={() => setRecovery("")}>
              I saved my recovery code <Check size={16} />
            </button>
          </div>
        </Modal>
      )}
      {privacy && (
        <Modal
          title="Privacy, scope & help"
          close={() => setPrivacy(false)}
          busy={false}
        >
          <div className="modal-body privacy-copy">
            <PrivacyContent />
          </div>
        </Modal>
      )}
      {(error || notice) && (
        <div
          className={"toast " + (error ? "error" : "")}
          role={error ? "alert" : "status"}
        >
          {error ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
          <span>{error || notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => {
              setError("");
              setNotice("");
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}
      {busy && (
        <div className="working-status" role="status">
          <LoaderCircle className="spin" size={15} /> Saving or interpreting
          your request…
        </div>
      )}
    </div>
  );
}
