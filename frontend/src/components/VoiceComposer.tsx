import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  LoaderCircle,
  Mic,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { api } from "../api";

function encodePcm(samples: Float32Array, rate: number) {
  const ratio = rate / 16000;
  const count = Math.floor(samples.length / ratio);
  const bytes = new Uint8Array(count * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * ratio),
      end = Math.min(samples.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += samples[j];
    const value = Math.max(-1, Math.min(1, sum / Math.max(1, end - start)));
    view.setInt16(i * 2, Math.round(value * (value < 0 ? 32768 : 32767)), true);
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 16000));
  return btoa(binary);
}

type Capture = {
  stream: MediaStream;
  context: AudioContext;
  node: AudioWorkletNode;
  chunks: Float32Array[];
  count: number;
};
export function VoiceComposer({
  busy,
  available,
  reply,
  onCommand,
}: {
  busy: boolean;
  available: boolean | null;
  reply: string;
  onCommand: (text: string) => Promise<boolean>;
}) {
  const [text, setText] = useState(""),
    [error, setError] = useState("");
  const [speech, setSpeech] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<
    "idle" | "starting" | "recording" | "transcribing"
  >("idle");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]),
    [enabled, setEnabled] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const capture = useRef<Capture | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token = useRef(0),
    mounted = useRef(true),
    lastReply = useRef(reply);
  const localVoice = voices.find(
    (v) => v.localService && /^en\b/i.test(v.lang),
  );
  useEffect(() => {
    mounted.current = true;
    api<{ available: boolean }>("speech")
      .then((r) => {
        if (mounted.current) setSpeech(r.available);
      })
      .catch(() => {
        if (mounted.current) setSpeech(false);
      });
    const synth = window.speechSynthesis;
    const update = () => setVoices(synth?.getVoices() ?? []);
    update();
    synth?.addEventListener("voiceschanged", update);
    return () => {
      mounted.current = false;
      token.current++;
      synth?.removeEventListener("voiceschanged", update);
      synth?.cancel();
      if (timer.current) clearTimeout(timer.current);
      capture.current?.stream.getTracks().forEach((t) => t.stop());
      capture.current?.node.disconnect();
      void capture.current?.context.close();
      capture.current = null;
    };
  }, []);
  useEffect(() => {
    if (!busy && phase !== "recording") {
      setSeconds(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(
      () => setSeconds(Math.floor((Date.now() - start) / 1000)),
      1000,
    );
    return () => clearInterval(interval);
  }, [busy, phase]);
  function speak(message: string) {
    if (!localVoice || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.voice = localVoice;
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }
  useEffect(() => {
    if (busy || lastReply.current === reply) return;
    lastReply.current = reply;
    if (enabled && localVoice && !busy) speak(reply);
  }, [reply, enabled, localVoice, busy]);

  async function recognize(
    samples: Float32Array,
    rate: number,
    requestToken: number,
  ) {
    setPhase("transcribing");
    try {
      const r = await api<{ text: string }>("speech/transcribe", {
        pcm: encodePcm(samples, rate),
      });
      if (!mounted.current || token.current !== requestToken) return;
      if (!r.text.trim())
        setError(
          "No clear speech was recognized. Try again, or type your request.",
        );
      else {
        setText(r.text);
        setError("");
      }
    } catch (e) {
      if (mounted.current && token.current === requestToken)
        setError((e as Error).message);
    } finally {
      if (mounted.current && token.current === requestToken) setPhase("idle");
    }
  }
  async function stopRecording() {
    const c = capture.current;
    if (!c) return;
    capture.current = null;
    if (timer.current) clearTimeout(timer.current);
    c.stream.getTracks().forEach((t) => t.stop());
    c.node.disconnect();
    const samples = new Float32Array(c.count);
    let offset = 0;
    for (const chunk of c.chunks) {
      samples.set(chunk, offset);
      offset += chunk.length;
    }
    await c.context.close();
    if (!mounted.current) return;
    if (samples.length < c.context.sampleRate / 4) {
      setPhase("idle");
      setError("Record at least a short sentence.");
      return;
    }
    await recognize(samples, c.context.sampleRate, token.current);
  }
  async function record() {
    if (phase === "recording") {
      await stopRecording();
      return;
    }
    const requestToken = ++token.current;
    setError("");
    setPhase("starting");
    window.speechSynthesis?.cancel();
    let stream: MediaStream | null = null,
      context: AudioContext | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      if (!mounted.current || requestToken !== token.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      context = new AudioContext();
      await context.audioWorklet.addModule("/readyby-capture.js");
      if (!mounted.current || requestToken !== token.current) {
        stream.getTracks().forEach((t) => t.stop());
        await context.close();
        return;
      }
      const source = context.createMediaStreamSource(stream),
        node = new AudioWorkletNode(context, "readyby-capture");
      const silent = context.createGain();
      silent.gain.value = 0;
      const c: Capture = { stream, context, node, chunks: [], count: 0 };
      capture.current = c;
      node.port.onmessage = (event: MessageEvent<Float32Array>) => {
        const remaining = Math.floor(c.context.sampleRate * 20) - c.count;
        if (remaining <= 0) return;
        const chunk = event.data.slice(0, remaining);
        c.chunks.push(chunk);
        c.count += chunk.length;
      };
      source.connect(node);
      node.connect(silent);
      silent.connect(context.destination);
      await context.resume();
      setPhase("recording");
      timer.current = setTimeout(() => void stopRecording(), 20000);
    } catch {
      stream?.getTracks().forEach((t) => t.stop());
      if (context && context.state !== "closed") void context.close();
      if (mounted.current) {
        setError(
          "Microphone access is unavailable. Allow it in your browser, or type your request.",
        );
        setPhase("idle");
      }
    }
  }
  async function useClip(file: File) {
    const requestToken = ++token.current;
    setError("");
    setPhase("transcribing");
    const context = new AudioContext();
    try {
      if (file.size > 5000000)
        throw Error(
          "Choose an audio clip smaller than 5 MB and shorter than 20 seconds.",
        );
      const decoded = await context.decodeAudioData(await file.arrayBuffer());
      if (decoded.duration > 20 || decoded.duration < 0.25)
        throw Error(
          "Choose a recording between a quarter second and 20 seconds.",
        );
      if (!mounted.current || requestToken !== token.current) return;
      await recognize(
        decoded.getChannelData(0),
        decoded.sampleRate,
        requestToken,
      );
    } catch (e) {
      if (mounted.current) {
        setError((e as Error).message);
        setPhase("idle");
      }
    } finally {
      await context.close();
    }
  }
  return (
    <section
      className="household-conversation"
      aria-label="Conversation with ReadyBy"
    >
      <div className="conversation-heading">
        <div>
          <h2>Talk it through.</h2>
          <p>Report a change, ask what’s next, or review a proposal.</p>
        </div>
        <button
          className="speech-toggle"
          disabled={!localVoice}
          aria-pressed={enabled}
          onClick={() => {
            if (enabled) window.speechSynthesis?.cancel();
            setEnabled(!enabled);
          }}
          title={
            localVoice
              ? "Uses an installed local voice"
              : "No local English voice is available in this browser"
          }
        >
          {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}{" "}
          {enabled ? "Spoken replies on" : "Spoken replies off"}
        </button>
      </div>
      <div className="household-reply" role="status">
        <span className="reply-mark" aria-hidden="true" />
        <p>
          {busy
            ? `Interpreting your request · ${seconds}s. Your plan is unchanged until the request is checked.`
            : reply}
        </p>
        {!busy && localVoice && (
          <button
            className="icon-button"
            aria-label="Listen to ReadyBy’s reply"
            onClick={() => speak(reply)}
          >
            <Volume2 size={19} />
          </button>
        )}
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (text.trim() && (await onCommand(text.trim()))) setText("");
        }}
      >
        <label htmlFor="household-request" className="sr-only">
          Your request
        </label>
        <textarea
          id="household-request"
          rows={2}
          maxLength={2000}
          value={text}
          disabled={busy || phase !== "idle"}
          onChange={(e) => setText(e.target.value)}
          placeholder="Try: The washer has another 15 minutes left."
        />
        <div className="voice-actions">
          <button
            type="button"
            className={
              "secondary record-button " +
              (phase === "recording" ? "recording" : "")
            }
            disabled={
              busy || !speech || ["starting", "transcribing"].includes(phase)
            }
            onClick={() => void record()}
          >
            {phase === "recording" ? (
              <Square size={16} />
            ) : phase === "starting" || phase === "transcribing" ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Mic size={17} />
            )}
            {phase === "recording"
              ? `Stop recording · ${seconds}s`
              : phase === "transcribing"
                ? "Transcribing locally…"
                : phase === "starting"
                  ? "Opening microphone…"
                  : "Record request"}
          </button>
          <span className="speech-status">
            {phase === "recording"
              ? "Listening · stops at 20 seconds"
              : speech === null
                ? "Checking local speech…"
                : speech
                  ? "Local speech · review the transcript before sending"
                  : "Speech setup needed · typing is available"}
          </span>
          <button
            className="primary"
            disabled={busy || phase !== "idle" || !available || !text.trim()}
          >
            <ArrowUp size={18} /> Send request
          </button>
        </div>
      </form>
      <details className="recorded-clip">
        <summary>Use a recorded speech clip</summary>
        <p>
          Recognize up to 20 seconds locally. Review the transcript before
          sending.
        </p>
        <label className="field">
          <span>Speech audio file</span>
          <input
            type="file"
            accept="audio/*"
            disabled={busy || phase !== "idle" || !speech}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void useClip(file);
              e.target.value = "";
            }}
          />
        </label>
      </details>
      {error && (
        <p className="voice-error" role="alert">
          {error}
        </p>
      )}
      {available === false && (
        <p className="voice-error">
          The AI provider is unavailable. Your saved plan and direct task
          controls remain available.
        </p>
      )}
    </section>
  );
}
