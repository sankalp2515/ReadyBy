import { useEffect, useRef, useState } from "react";
import type { Session, LiveServerMessage } from "@google/genai";
import { Mic, Square, LoaderCircle, ShieldCheck } from "lucide-react";
import { api } from "../api";
import { encodePcm } from "../pcm";
import "../live.css";

export type VoiceResult = { ok: boolean; reply: string };
type Resources = {
  session?: Session;
  stream?: MediaStream;
  input?: AudioContext;
  output?: AudioContext;
  node?: AudioWorkletNode;
  timer?: ReturnType<typeof setTimeout>;
  sources: Set<AudioBufferSourceNode>;
  next: number;
};

export function LiveVoice({
  onCommand,
  onActivity,
}: {
  onCommand: (text: string) => Promise<VoiceResult>;
  onActivity?: (active: boolean) => void;
}) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [phase, setPhase] = useState("idle");
  const [heard, setHeard] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    onActivity?.(phase !== "idle");
    return () => onActivity?.(false);
  }, [phase === "idle", onActivity]);
  const resources = useRef<Resources | null>(null),
    generation = useRef(0),
    command = useRef(onCommand);
  command.current = onCommand;

  function stop(update = true) {
    generation.current++;
    const r = resources.current;
    resources.current = null;
    if (r) {
      clearTimeout(r.timer);
      r.stream?.getTracks().forEach((t) => t.stop());
      r.node?.disconnect();
      r.sources.forEach((s) => {
        try {
          s.stop();
        } catch {
          /* ended */
        }
      });
      r.session?.close();
      void r.input?.close();
      void r.output?.close();
    }
    if (update) setPhase("idle");
  }
  useEffect(() => {
    let alive = true;
    api<{ available: boolean }>("live")
      .then((r) => {
        if (alive) setAvailable(r.available);
      })
      .catch(() => {
        if (alive) setAvailable(false);
      });
    return () => {
      alive = false;
      stop(false);
    };
  }, []);
  useEffect(() => {
    if (phase === "idle") return;
    const start = Date.now();
    const timer = setInterval(
      () => setSeconds(Math.floor((Date.now() - start) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [phase === "idle"]);

  async function start() {
    if (resources.current) return;
    const id = ++generation.current;
    const r: Resources = { sources: new Set(), next: 0 };
    resources.current = r;
    let transcript = "",
      lastRequest = "",
      speaking = "";
    const calls = new Set<string>();
    setError("");
    setHeard("");
    setAnswer("");
    setSeconds(0);
    setPhase("connecting");
    const current = () => generation.current === id && resources.current === r;
    const fail = (message: string) => {
      if (current()) {
        stop();
        setError(message);
      }
    };
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "Live voice needs HTTPS and microphone support. Typing still works.",
        );
      r.timer = setTimeout(
        () =>
          fail(
            "Voice took too long to connect. Check microphone permission, then retry or type below.",
          ),
        20000,
      );
      // Unlock playback inside the Start button gesture, before awaiting permission.
      r.input = new AudioContext();
      r.output = new AudioContext({ sampleRate: 24000 });
      await Promise.all([r.input.resume(), r.output.resume()]);
      if (!current()) return;
      r.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      if (!current()) {
        r.stream.getTracks().forEach((t) => t.stop());
        return;
      }
      r.stream
        .getAudioTracks()
        .forEach((track) =>
          track.addEventListener("ended", () =>
            fail(
              "Your microphone disconnected. Reconnect it and start again, or type below.",
            ),
          ),
        );
      const [{ GoogleGenAI }, credentials] = await Promise.all([
        import("@google/genai"),
        api<{ token: string; model: string; config: any; expiresAt: string }>(
          "live/session",
          {},
        ),
      ]);
      if (!current()) return;
      const client = new GoogleGenAI({
        apiKey: credentials.token,
        httpOptions: { apiVersion: "v1alpha" },
      });
      async function message(m: LiveServerMessage) {
        if (!current()) return;
        const content = m.serverContent;
        if (content?.interrupted) {
          r.sources.forEach((s) => {
            try {
              s.stop();
            } catch {
              /* ended */
            }
          });
          r.sources.clear();
          r.next = 0;
          speaking = "";
          setPhase("listening");
        }
        if (content?.inputTranscription?.text) {
          transcript += content.inputTranscription.text;
          setHeard(transcript);
          setPhase("listening");
        }
        if (content?.outputTranscription?.text) {
          speaking += content.outputTranscription.text;
          setAnswer(speaking);
        }
        for (const part of content?.modelTurn?.parts ?? []) {
          if (!part.inlineData?.data || !r.output) continue;
          const raw = atob(part.inlineData.data),
            bytes = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
          const data = new DataView(bytes.buffer),
            buffer = r.output.createBuffer(
              1,
              Math.floor(bytes.length / 2),
              24000,
            );
          const channel = buffer.getChannelData(0);
          for (let i = 0; i < channel.length; i++)
            channel[i] = data.getInt16(i * 2, true) / 32768;
          const source = r.output.createBufferSource();
          source.buffer = buffer;
          source.connect(r.output.destination);
          r.sources.add(source);
          source.onended = () => {
            r.sources.delete(source);
            if (current() && !r.sources.size) setPhase("listening");
          };
          r.next = Math.max(r.output.currentTime, r.next);
          source.start(r.next);
          r.next += buffer.duration;
          setPhase("speaking");
        }
        for (const call of m.toolCall?.functionCalls ?? []) {
          if (!call.id || calls.has(call.id)) continue;
          calls.add(call.id);
          setPhase("checking");
          // Only an actual microphone transcript may reach the MCP bridge. No model arguments execute.
          const text = transcript.trim();
          transcript = "";
          let result: VoiceResult = {
            ok: false,
            reply: "I could not hear a new request. Please say it again.",
          };
          if (
            text &&
            text !== lastRequest &&
            call.name === "household_request"
          ) {
            lastRequest = text;
            try {
              result = await command.current(text);
            } catch {
              result = {
                ok: false,
                reply:
                  "I could not verify that change. Please retry or use the task controls.",
              };
            }
          }
          if (current())
            r.session?.sendToolResponse({
              functionResponses: [
                { id: call.id, name: call.name, response: result },
              ],
            });
        }
        if (content?.turnComplete) {
          transcript = "";
          lastRequest = "";
          speaking = "";
          if (!r.sources.size) setPhase("listening");
        }
      }
      const session = await client.live.connect({
        model: credentials.model,
        config: credentials.config,
        callbacks: {
          onmessage: (m) => {
            void message(m).catch(() =>
              fail(
                "The voice connection was interrupted. Your saved plan is available.",
              ),
            );
          },
          onerror: () =>
            fail(
              "Live voice could not connect. Please retry or type your request.",
            ),
          onclose: () => {
            if (current()) {
              stop();
              setError(
                "Voice session ended. Start again to continue, or type below.",
              );
            }
          },
        },
      });
      if (!current()) {
        session.close();
        return;
      }
      r.session = session;
      clearTimeout(r.timer);
      await r.input.audioWorklet.addModule("/readyby-capture.js");
      if (!current()) return;
      const node = new AudioWorkletNode(r.input, "readyby-capture");
      r.node = node;
      let chunks: Float32Array[] = [],
        count = 0;
      node.port.onmessage = (e) => {
        if (!current() || !r.input) return;
        const chunk = e.data as Float32Array;
        chunks.push(chunk);
        count += chunk.length;
        if (count < r.input.sampleRate / 10) return;
        const samples = new Float32Array(count);
        let offset = 0;
        chunks.forEach((c) => {
          samples.set(c, offset);
          offset += c.length;
        });
        chunks = [];
        count = 0;
        session.sendRealtimeInput({
          audio: {
            data: encodePcm(samples, r.input.sampleRate),
            mimeType: "audio/pcm;rate=16000",
          },
        });
      };
      const source = r.input.createMediaStreamSource(r.stream);
      source.connect(node);
      node.connect(r.input.destination);
      setPhase("listening");
      r.timer = setTimeout(
        () => {
          if (current()) {
            stop();
            setError(
              "The three-minute demo session ended. You can start another session if allowance remains.",
            );
          }
        },
        Math.max(0, new Date(credentials.expiresAt).getTime() - Date.now()),
      );
    } catch (e) {
      fail(
        e instanceof Error && e.name === "NotAllowedError"
          ? "Microphone permission was declined. Allow it in your browser or type below."
          : e instanceof Error
            ? e.message
            : "Voice could not start. Please type your request.",
      );
    }
  }
  const active = phase !== "idle";
  return (
    <section
      className={"live-voice " + (active ? "is-live" : "")}
      aria-label="Hands-free conversation"
    >
      <div className="live-intro">
        <div className="voice-orb" aria-hidden="true">
          <Mic size={25} />
        </div>
        <div>
          <span className="live-eyebrow">REAL-TIME VOICE · GEMINI LIVE</span>
          <h2>
            {active
              ? phase === "connecting"
                ? "Connecting your microphone…"
                : phase === "speaking"
                  ? "ReadyBy is speaking."
                  : phase === "checking"
                    ? "Checking your actual plan…"
                    : "Listening. What changed?"
              : "Say it. Keep your hands free."}
          </h2>
          <p>“The washer has another fifteen minutes left.”</p>
        </div>
        <button
          className={active ? "secondary live-stop" : "primary"}
          onClick={() => (active ? stop() : void start())}
          disabled={!active && available !== true}
        >
          {active ? (
            <Square size={16} />
          ) : available === null ? (
            <LoaderCircle size={17} className="spin" />
          ) : (
            <Mic size={17} />
          )}
          {active ? `Stop voice · ${seconds}s` : "Start live voice"}
        </button>
      </div>
      <p className="live-disclosure">
        <ShieldCheck size={14} />
        {active
          ? phase === "connecting"
            ? "Connecting · allow microphone access in your browser."
            : "Microphone on · interrupt naturally · stops after 3 minutes."
          : "Starts only when you choose. Audio is sent to Google while connected."}{" "}
        Approval requires the exact on-screen review.
      </p>
      {active && (
        <div className="live-captions" aria-live="polite">
          <p>
            <span>You</span>
            {heard || "Speak normally. No wake word needed."}
          </p>
          <p>
            <span>ReadyBy</span>
            {answer ||
              "Your requests use the real MCP tools and checked scheduler."}
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="voice-error">
          {error}
        </p>
      )}
      {available === false && (
        <p className="voice-error">
          Live voice is currently unavailable. Type below or use the task
          controls.
        </p>
      )}
    </section>
  );
}
