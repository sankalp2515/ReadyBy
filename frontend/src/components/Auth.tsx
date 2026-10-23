import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Play,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import { api } from "../api";

import { Brand, Field } from "./Shared";
import { Landing } from "./Landing";

export function Auth({
  onAuth,
  busy,
}: {
  onAuth: (path: string, body: unknown) => Promise<boolean>;
  busy: boolean;
}) {
  const [mode, setMode] = useState("welcome"),
    [newCode, setNewCode] = useState(""),
    [localError, setLocalError] = useState(""),
    [recovering, setRecovering] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError("");
    const f = Object.fromEntries(new FormData(e.currentTarget));
    if (mode === "recover") {
      if (recovering) return;
      setRecovering(true);
      try {
        const r = await api("auth/recover", f);
        setNewCode(r.recoveryCode);
        setMode("recovered");
      } catch (x) {
        setLocalError((x as Error).message);
      } finally {
        setRecovering(false);
      }
      return;
    }
    await onAuth(mode === "signup" ? "signup" : "login", {
      ...f,
      names: [f.displayName, f.partner].filter(Boolean),
    });
  };
  if (mode === "welcome") return <Landing busy={busy} onDemo={()=>void onAuth("demo",{})} onSignup={()=>setMode("signup")} onLogin={()=>setMode("login")}/>;
  return (
    <main className="auth">
      <section className="auth-story">
        <Brand />
        <div className="auth-story-body">
          <span className="auth-eyebrow">THE HOUSEHOLD AGENT THAT ADAPTS</span>
          <h1>
            Less last-minute.
            <br />
            More together.
          </h1>
          <p>
            For the bags, the breakfast, and the things that never go quite to
            plan.
          </p>
          <div
            className="departure-illustration"
            aria-label="Example household plan"
          >
            <div className="illustration-heading">
              <span>
                <Sun size={19} /> A calmer morning
              </span>
              <span>ILLUSTRATION</span>
            </div>
            <div className="illustration-deadline">
              <strong>08:20</strong>
              <span>out the door, together.</span>
            </div>
            <div className="illustration-line">
              <span>M</span>
              <div>
                <Check size={16} /> School bag ready
              </div>
              <div className="illustration-pending">Shoes</div>
            </div>
            <div className="illustration-line">
              <span>A</span>
              <div>
                <Check size={16} /> Lunch packed
              </div>
              <div className="illustration-pending">Bottles</div>
            </div>
            <div className="illustration-note">
              <Sparkles size={18} />
              <span>Plans change. Your departure doesn't have to.</span>
            </div>
          </div>
        </div>
        <div className="auth-foot">
          <LockKeyhole size={14} /> Your plans stay in your household workspace.
        </div>
      </section>
      <section className="auth-entry">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="entry-inner">
          {mode === "welcome" ? (
            <>
              <span className="eyebrow">WELCOME TO READYBY</span>
              <h2>
                Make the next
                <br />
                departure easier.
              </h2>
              <p className="entry-intro">
                Share the prep. See what’s next. Recover together when life gets
                in the way.
              </p>
              <button
                className="primary full large"
                disabled={busy}
                onClick={() => setMode("signup")}
              >
                Create your household <ArrowRight size={18} />
              </button>
              <button
                className="secondary full large"
                disabled={busy}
                onClick={() => onAuth("demo", {})}
              >
                <Play size={17} /> Explore a private demo
              </button>
              <p className="auth-signin">
                Already have a household?{" "}
                <button
                  className="text-button"
                  onClick={() => setMode("login")}
                >
                  Sign in
                </button>
              </p>
              <div className="entry-trust">
                <ShieldCheck size={22} />
                <p>
                  <strong>Start without connecting anything.</strong>
                  <br />
                  No calendar, smart devices or subscriptions required.
                </p>
              </div>
              <small className="simulation-note">
                Local private beta · Alexa+ web simulation
              </small>
            </>
          ) : mode === "recovered" ? (
            <>
              <KeyRound size={35} />
              <h2>Access recovered.</h2>
              <p>
                Your previous sessions are signed out. Save your new recovery
                code before signing in.
              </p>
              <code className="recovery-code">{newCode}</code>
              <button
                className="primary full"
                onClick={() => {
                  setNewCode("");
                  setMode("login");
                }}
              >
                I saved it. Sign in <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                className="text-button back-link"
                onClick={() => {
                  setMode("welcome");
                  setLocalError("");
                }}
              >
                ← Back
              </button>
              <span className="eyebrow">YOUR PRIVATE WORKSPACE</span>
              <h2>
                {mode === "signup"
                  ? "A little setup.\nA lot less juggling."
                  : mode === "recover"
                    ? "Let’s get you back in."
                    : "Welcome home."}
              </h2>
              <p className="entry-intro">
                {mode === "signup"
                  ? "One or two adults. One shared plan."
                  : mode === "recover"
                    ? "Use the recovery code saved when you created your account."
                    : "Sign in to your saved household plans."}
              </p>
              <form onSubmit={submit}>
                {mode === "signup" && (
                  <>
                    <div className="form-grid">
                      <Field label="Your name">
                        <input
                          name="displayName"
                          autoComplete="given-name"
                          required
                          maxLength={40}
                          placeholder="Maya"
                        />
                      </Field>
                      <Field label="Other adult (optional)">
                        <input
                          name="partner"
                          maxLength={40}
                          placeholder="Arun"
                        />
                      </Field>
                    </div>
                    <Field label="Household name">
                      <input
                        name="householdName"
                        required
                        maxLength={60}
                        placeholder="Our household"
                        autoComplete="organization"
                      />
                    </Field>
                  </>
                )}
                <Field
                  label="Account name"
                  hint={
                    mode === "signup"
                      ? "3–40 characters: letters, numbers, dots, underscores or hyphens."
                      : undefined
                  }
                >
                  <input
                    name="username"
                    autoComplete="username"
                    required
                    minLength={3}
                    maxLength={40}
                    pattern="[a-zA-Z0-9][a-zA-Z0-9_.-]+"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </Field>
                {mode === "recover" && (
                  <Field label="Recovery code">
                    <input
                      name="recoveryCode"
                      required
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </Field>
                )}
                <Field
                  label={mode === "recover" ? "New passphrase" : "Passphrase"}
                  hint={
                    mode !== "login"
                      ? "Use at least 12 characters. A few memorable words work well."
                      : undefined
                  }
                >
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={mode === "login" ? 1 : 12}
                    maxLength={128}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                </Field>
                {localError && (
                  <p className="inline-error" role="alert">
                    {localError}
                  </p>
                )}
                <button
                  className="primary full large"
                  disabled={busy || recovering}
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <ArrowRight size={17} />
                  )}{" "}
                  {mode === "signup"
                    ? "Create household"
                    : mode === "recover"
                      ? "Recover access"
                      : "Sign in"}
                </button>
              </form>
              {mode === "login" && (
                <button
                  className="text-button recover-link"
                  onClick={() => setMode("recover")}
                >
                  Forgot your passphrase?
                </button>
              )}
              <p className="simulation-note">
                Accounts and plans are stored on this ReadyBy server. Save your
                recovery code; there is no email reset.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
