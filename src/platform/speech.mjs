import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, basename } from "node:path";
import { createInterface } from "node:readline";
import { randomUUID } from "node:crypto";
import { DomainError, requireThat } from "../readyby/schema.mjs";

export function createSpeechService() {
  const model =
    process.env.READYBY_SPEECH_MODEL ||
    resolve("data/speech/vosk-model-small-en-us-0.15");
  const bundled = resolve(
    ".venv-speech",
    process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
  );
  const python =
    process.env.READYBY_SPEECH_PYTHON ||
    (existsSync(bundled) ? bundled : "python");
  let worker,
    loading,
    ready = false,
    pending = null;
  const unavailable = () =>
    new DomainError(
      "Server transcription is unavailable. Run the speech setup, or type your request.",
      "SPEECH_UNAVAILABLE",
    );
  function start() {
    if (ready) return Promise.resolve();
    if (loading) return loading;
    if (!existsSync(resolve(model, "am/final.mdl")))
      return Promise.reject(unavailable());
    loading = new Promise((ok, fail) => {
      const timer = setTimeout(() => {
        fail(unavailable());
        worker?.kill();
      }, 20000);
      worker = spawn(
        python,
        ["-u", resolve("scripts/speech-worker.py"), model],
        { stdio: ["pipe", "pipe", "pipe"], windowsHide: true },
      );
      worker.stderr.on("data", () => {});
      createInterface({ input: worker.stdout }).on("line", (line) => {
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          return;
        }
        if (msg.ready) {
          ready = true;
          clearTimeout(timer);
          ok();
        }
        if (pending && msg.id === pending.id) {
          const current = pending;
          pending = null;
          clearTimeout(current.timer);
          msg.error
            ? current.fail(unavailable())
            : current.ok({
                text: msg.text,
                provider: "Vosk local",
                model: basename(model),
                latencyMs: Date.now() - current.started,
              });
        }
      });
      const stopped = () => {
        clearTimeout(timer);
        ready = false;
        loading = null;
        if (pending) {
          clearTimeout(pending.timer);
          pending.fail(unavailable());
          pending = null;
        }
        fail(unavailable());
      };
      worker.once("error", stopped);
      worker.once("exit", stopped);
    });
    return loading;
  }
  return {
    async health() {
      try {
        await start();
        return {
          available: true,
          provider: "Vosk local",
          sampleRate: 16000,
          maxSeconds: 20,
        };
      } catch {
        return {
          available: false,
          provider: "Vosk local",
          sampleRate: 16000,
          maxSeconds: 20,
        };
      }
    },
    async transcribe(pcm) {
      requireThat(
        typeof pcm === "string" &&
          pcm.length >= 100 &&
          pcm.length <= 860000 &&
          /^[A-Za-z0-9+/]+={0,2}$/.test(pcm),
        "Provide a PCM16 recording of at most 20 seconds.",
      );
      const bytes = Buffer.from(pcm, "base64");
      requireThat(
        bytes.length >= 1600 &&
          bytes.length <= 640000 &&
          bytes.length % 2 === 0,
        "Use mono PCM16 at 16000 Hz, up to 20 seconds.",
      );
      await start();
      requireThat(
        !pending,
        "Server transcription is busy. Please retry.",
        "RATE_LIMIT",
      );
      return new Promise((ok, fail) => {
        const id = randomUUID();
        const timer = setTimeout(() => {
          if (pending?.id === id) {
            pending = null;
            fail(unavailable());
            worker?.kill();
          }
        }, 20000);
        pending = { id, ok, fail, timer, started: Date.now() };
        worker.stdin.write(JSON.stringify({ id, pcm }) + "\n");
      });
    },
    close() {
      worker?.kill();
    },
  };
}
