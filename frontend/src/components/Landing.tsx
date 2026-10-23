import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Mic,
  ShieldCheck,
  Users,
  LoaderCircle,
  ArrowUpRight,
} from "lucide-react";
import { Brand } from "./Shared";
import { api } from "../api";
import { fmt } from "../model";
import "../landing.css";

type Sample = {
  chapter: string;
  deadline: number;
  finish: number;
  verified: boolean;
  completed: string[];
  options: { kind: string; finish: number; deadline: number }[];
  tasks: { title: string; owner: string; status: string; required: boolean }[];
};

export function PrivacyContent() {
  return (
    <div className="privacy-copy">
      <h3>Your microphone, your choice.</h3>
      <p>
        Live voice starts only when you select Start live voice and allow
        microphone access. Audio streams to Google Gemini while the session is
        on. Stop voice ends capture and closes the connection. There is no
        background wake word.
      </p>
      <h3>Know where your words go.</h3>
      <p>
        Typed requests and bounded household context go to the configured AI
        provider. Live voice also uses Gemini for speech. The separate
        recorded-transcript option processes audio on this ReadyBy server.
        ReadyBy does not save raw audio; submitted text, tool receipts and
        household plans are stored in your workspace. Provider terms govern
        their processing.
      </p>
      <h3>A plan is an estimate.</h3>
      <p>
        ReadyBy checks task dependencies, waits and each person's time. It
        cannot see physical chores, confirm an appliance state or guarantee
        departure. You report completion. Essential work is protected; proposed
        changes require review.
      </p>
      <h3>A working Alexa+ simulation.</h3>
      <p>
        This independent beta has real AI and MCP tools, with no native Echo
        connection, Alexa wake word, appliance telemetry or push notifications.
        Demo chapters use fictional people and explicitly seeded progress. Human
        speech quality varies with your browser, microphone and connection.
      </p>
      <p>
        Use fictional details while evaluating. The owner can export or delete a
        household in Settings. Guest demos are separate workspaces, with no
        recoverable account sign-in.{" "}
        <a
          href="https://ai.google.dev/gemini-api/terms"
          target="_blank"
          rel="noreferrer"
        >
          Google API terms <ArrowUpRight size={13} />
        </a>
      </p>
    </div>
  );
}

export function Landing({
  busy,
  onDemo,
  onSignup,
  onLogin,
  returning = false,
}: {
  busy: boolean;
  onDemo: () => void;
  onSignup: () => void;
  onLogin: () => void;
  returning?: boolean;
}) {
  const [chapter, setChapter] = useState("delay"),
    [samples, setSamples] = useState<Sample[]>([]),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    api<{ samples: Sample[] }>("demo/preview")
      .then((r) => {
        if (alive) setSamples(r.samples);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  const sample = samples.find((s) => s.chapter === chapter),
    recovery = sample?.options.find((o) => o.kind === "defer");
  const demoButton = (
    label = returning ? "Return to workspace" : "Try the live demo",
  ) => (
    <button className="primary landing-cta" disabled={busy} onClick={onDemo}>
      {busy ? <LoaderCircle size={17} className="spin" /> : <Mic size={17} />}{" "}
      {busy ? "Opening your private demo…" : label}{" "}
      {!busy && <ArrowRight size={17} />}
    </button>
  );
  return (
    <div className="landing">
      <a className="skip-link" href="#landing-main">
        Skip to content
      </a>
      <header className="landing-nav">
        <a href="#" aria-label="ReadyBy home">
          <Brand />
        </a>
        <nav aria-label="Product navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#recovery-preview">See a recovery</a>
          <a href="#trust">Privacy & limits</a>
        </nav>
        <div>
          <button className="text-button" onClick={onLogin}>
            {returning ? "Back to workspace" : "Sign in"}
          </button>
          {demoButton()}
        </div>
      </header>
      <main id="landing-main">
        <section className="landing-hero" aria-labelledby="landing-title">
          <p className="landing-context">
            <span /> A household plan that adapts with you
          </p>
          <h1 id="landing-title">
            One departure.
            <br />A plan that keeps up.
          </h1>
          <p className="landing-lead">
            The bags, the breakfast, the washer that needs longer.
            <br className="desktop-break" /> Tell ReadyBy what changed. Find a
            checked way forward, together.
          </p>
          <div className="landing-hero-actions">
            {demoButton()}
            <a className="landing-tour" href="#recovery-preview">
              See what changes <ArrowRight size={17} />
            </a>
          </div>
          <p className="landing-fineprint">
            {returning
              ? "Your current workspace is saved. Examples below are fictional."
              : "No signup for the demo. Fictional household. Alexa+ web simulation."}
          </p>
        </section>
        <section
          className="landing-preview"
          id="recovery-preview"
          aria-label="Computed household recovery example"
        >
          <div className="preview-top">
            <span>
              <Clock3 size={17} /> ReadyBy / School run
            </span>
            <span>Computed sample · not your household</span>
          </div>
          <div className="preview-heading">
            <div>
              <h2>
                The morning changed.
                <br />
                The plan can respond.
              </h2>
              <p>Two adults. Seven tasks. One shared departure.</p>
            </div>
            <div className="preview-deadline">
              <span>Leave by</span>
              <strong>08:20</strong>
            </div>
          </div>
          <div
            className="preview-tabs"
            role="group"
            aria-label="Explore the computed example"
          >
            {[
              ["opening", "Original plan"],
              ["delay", "Washer delayed"],
              ["essential", "Laundry is essential"],
            ].map(([id, label]) => (
              <button
                key={id}
                id={`preview-tab-${id}`}
                aria-pressed={chapter === id}
                aria-controls="preview-panel"
                onClick={() => setChapter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            className="preview-body"
            id="preview-panel"
            role="region"
            aria-labelledby={`preview-tab-${chapter}`}
          >
            <div className="preview-tasks">
              {(sample?.tasks ?? []).slice(0, 6).map((t) => (
                <div key={t.title}>
                  <span
                    className={
                      t.status === "completed"
                        ? "preview-done"
                        : "preview-task-dot"
                    }
                  >
                    {t.status === "completed" ? (
                      <Check size={14} />
                    ) : (
                      <Clock3 size={14} />
                    )}
                  </span>
                  <div>
                    <strong>{t.title}</strong>
                    <small>
                      {t.owner} · {t.required ? "Essential" : "Flexible"}
                    </small>
                  </div>
                  <span>
                    {t.status === "completed"
                      ? "Reported complete"
                      : t.title === "Hang laundry" && chapter !== "opening"
                        ? "15 min wait"
                        : t.status === "active"
                          ? "In progress"
                          : "In the plan"}
                  </span>
                </div>
              ))}
            </div>
            <div className="preview-result" aria-live="polite">
              {!sample ? (
                <p>
                  {failed
                    ? "The computed sample is temporarily unavailable. You can still open the demo."
                    : "Calculating the sample…"}
                </p>
              ) : (
                <>
                  <span>
                    {chapter === "opening"
                      ? "A checked starting point"
                      : chapter === "delay"
                        ? "A trade-off to review"
                        : "An honest limit"}
                  </span>
                  <h3>
                    {chapter === "opening"
                      ? "Ready with a little room."
                      : chapter === "delay"
                        ? "Keep the departure. Save laundry for later."
                        : "Some work cannot move."}
                  </h3>
                  <div className="preview-comparison">
                    <span>
                      All work finishes<strong>{fmt(sample.finish)}</strong>
                    </span>
                    {recovery && (
                      <span>
                        Proposed retained work
                        <strong>{fmt(recovery.finish)}</strong>
                      </span>
                    )}
                  </div>
                  <p>
                    {chapter === "opening"
                      ? "One minute of planned buffer, using these estimates."
                      : chapter === "delay"
                        ? "Bag and lunch reports stay complete. Flexible laundry can wait, but only after you review the change."
                        : "With laundry essential, 08:20 cannot work under these estimates. ReadyBy offers a later departure instead of quietly dropping it."}
                  </p>
                  <small>
                    <ShieldCheck size={15} />
                    {sample.verified
                      ? "Schedule independently checked"
                      : "Review the supplied constraints"}
                  </small>
                  <p className="sample-disclosure">
                    Fictional estimates and progress. Selecting a tab changes
                    this sample, not a real plan.
                  </p>
                </>
              )}
            </div>
          </div>
        </section>
        <section className="landing-workflow" id="how-it-works">
          <div>
            <p className="section-context">Less mental replanning</p>
            <h2>
              Say what changed.
              <br />
              Keep what matters.
            </h2>
            <p>
              A reminder tells you what to do. ReadyBy also checks what can
              still fit when time slips.
            </p>
          </div>
          <ol>
            <li>
              <Mic />
              <div>
                <h3>Talk naturally.</h3>
                <p>
                  “The washer needs more time.” ReadyBy asks for missing
                  minutes, then keeps the thread.
                </p>
              </div>
            </li>
            <li>
              <Users />
              <div>
                <h3>See a realistic next step.</h3>
                <p>
                  People, prerequisites and passive waits share one plan.
                  Completed work stays completed.
                </p>
              </div>
            </li>
            <li>
              <ShieldCheck />
              <div>
                <h3>Review the trade-off.</h3>
                <p>
                  Keep essentials. Agree before moving a task or changing
                  departure. Deferred work stays unfinished.
                </p>
              </div>
            </li>
          </ol>
        </section>
        <section className="landing-proof">
          <div>
            <p className="section-context">A product you can inspect</p>
            <h2>
              Useful on the surface.
              <br />
              Accountable underneath.
            </h2>
            <p>
              The demo uses real MCP calls, real configured AI and a schedule
              checker. Open System review to inspect what ran and why.
            </p>
            <a
              href="https://github.com/sankalp2515/ReadyBy"
              target="_blank"
              rel="noreferrer"
            >
              <ArrowUpRight size={17} /> Explore the source{" "}
              <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="landing-proof-facts">
            <div>
              <strong>13</strong>
              <span>Discoverable household MCP tools</span>
            </div>
            <div>
              <strong>64</strong>
              <span>Passing automated tests at the 0.4 release</span>
            </div>
            <div>
              <strong>30/30</strong>
              <span>
                Declared development utterances in the selected 0.3 pipeline
              </span>
            </div>
            <p>
              Engineering evidence, not customer adoption or a guarantee of
              arbitrary-request accuracy. Current validation and limitations are
              recorded in the repository.
            </p>
          </div>
        </section>
        <section className="landing-trust" id="trust">
          <div>
            <p className="section-context">Before you begin</p>
            <h2>
              Clear boundaries.
              <br />
              People in control.
            </h2>
            <p>
              No calendar, appliance connection or subscription purchase is
              needed to explore the demo.
            </p>
          </div>
          <div>
            <details open>
              <summary>What does the demo simulate?</summary>
              <p>
                It simulates an Alexa+ household conversation in your browser.
                The model, MCP tools and schedule calculations are real. Native
                Echo access and appliance sensing are not connected.
              </p>
            </details>
            <details>
              <summary>Does it guarantee we leave on time?</summary>
              <p>
                No. It checks your estimates and reported progress. If
                essentials cannot fit, it explains the conflict. Physical
                completion always needs a report.
              </p>
            </details>
            <details>
              <summary>How are voice and household data handled?</summary>
              <PrivacyContent />
            </details>
          </div>
        </section>
        <section className="landing-final">
          <h2>A little less to carry.</h2>
          <p>Explore a school run. Change an estimate. See what still works.</p>
          {demoButton()}
          {!returning && (
            <button className="text-button" onClick={onSignup}>
              Or create your household
            </button>
          )}
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <p>Independent beta · Alexa+ experience simulation</p>
        <a
          href="https://github.com/sankalp2515/ReadyBy"
          target="_blank"
          rel="noreferrer"
        >
          Source & documentation <ArrowUpRight size={14} />
        </a>
      </footer>
    </div>
  );
}
