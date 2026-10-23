# ReadyBy setup and operation

**When a household plan slips, recover the deadline without losing progress or silently dropping essentials.**

ReadyBy 0.4 is an Alexa+ experience simulator backed by a **real self-hosted MCP server**. The React app and an independent CLI use the official MCP SDK, protocol **2025-11-25**, and **Streamable HTTP**. AI interprets language; deterministic scheduling and an independent checker establish feasibility. Consequential revisions require review and confirmation bound to the exact proposal.

A public judge beta is also [hosted over HTTPS](HOSTING.md). Native Alexa/Echo connectivity, appliance telemetry and AWS are not implemented. Local installations keep their own household storage; hosted text AI sends the request and bounded mission context to its provider. Gemini Live voice streams microphone audio to Google while connected. Select Ollama for local text inference.

Start with [0.4 verification](READYBY_0_4_VERIFICATION.md), [retained 0.3 MCP verification](READYBY_MCP_VERIFICATION.md), [final handoff](READYBY_FINAL_HANDOFF.md), and the [architecture](architecture/readyby-actual-architecture.png). Earlier v0.1/v0.2 reports are historical.

## Run

Requirements: Node 22.20+, pnpm and a modern browser. The tested Node version reports built-in SQLite as experimental.

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
node app-server.mjs
```

Open http://127.0.0.1:4173 and choose **Try the live demo**. No external account is needed. Creating a permanent household uses a passphrase and a one-use recovery code; save that code when shown. Guest demos have no recoverable account sign-in.

The attached ReadyBy-Local-Submission.zip release bundle contains a prebuilt frontend. A Git checkout or GitHub-generated source archive requires pnpm build. `node app-server.mjs` still requires installed Node dependencies, including the MCP SDK. Default storage is `data/readyby-platform.sqlite`, default port 4173, bound to loopback. `.env` is loaded at startup; existing shell variables take precedence. Copy `.env.example` or set variables directly. Real keys, databases, backups and installed runtimes are excluded from the archive.

### Choose AI

**Local mode, no hosted key:** install [Ollama](https://ollama.com/), run `ollama pull llama3:8b-instruct-q4_K_M`, set `READYBY_AI_PROVIDER=ollama`, and start the app. Approximately 5 GB of model weights are not bundled; check their license and hardware requirements. This mode disables hosted fallback. Without an available model, task controls and typed MCP tools still work; conversation reports unavailable rather than fabricating an answer.

**Hosted mode:** set `READYBY_AI_PROVIDER=groq` and `GROQ_API_KEY` server-side. Selected model: `READYBY_GROQ_MODEL=openai/gpt-oss-120b`. Optional fallback: `READYBY_AI_FALLBACKS=gemini`, `GEMINI_API_KEY`, `READYBY_GEMINI_MODEL=gemini-3.1-flash-lite`. Quota cooldown and actual attempts appear in receipts. `READYBY_AI_PROVIDER=gemini` or `nvidia` also selects those adapters directly. NVIDIA was unreliable in screening and is not an automatic fallback. No keys are supplied in this repository.

With no explicit provider, auto mode chooses configured Gemini, then Groq, then NVIDIA, or installed Ollama. Select the provider explicitly for reproducible review. Configuration indicates credentials exist, not a guarantee of quota or availability. Local mode has no paid-service requirement.

Hosted inference sends text and task/person context to the actual provider. Live voice streams audio to Google using a short-lived credential. Optional recorded transcription processes audio on the ReadyBy server. Permanent keys never reach frontend code. Provider terms, quota and billing apply to hosted calls.

### Live voice

Set `GEMINI_API_KEY` on the server, restart, and choose **Start live voice** in the household display. Allow microphone access; no wake word is needed. Speak normally and interrupt replies naturally. Stop closes capture. A funded Gemini API project is required; a new project may need AI Studio prepayment. See [voice configuration, privacy and limitations](LIVE_VOICE.md).

### Optional recorded transcription

```powershell
python scripts/setup-speech.py
node app-server.mjs
```

Tested with Python 3.12 on Windows. Setup creates `.venv-speech` and downloads a checksum-verified Apache-2.0 Vosk model. Use **Record request**, stop, review/edit, then **Send request**. Recorded clips are another input path. Capture stops at 20 seconds; raw audio is not saved by the application. Replies use installed local English voices and start with sound off. Human microphone accuracy and listening quality remain rehearsal gates. This is push-to-talk with transcript review, not wake-word or native Alexa speech.

## Reproduce the recovery

1. Explore a private demo. Checked opening finish: 08:19 for an 08:20 departure.
2. **Review system → 2 · Washer disruption** explicitly seeds 08:06 with reported bag/lunch completion. Labelled chapters do not generate AI responses.
3. Return to Household display and type **The washer needs more time.** The actual model asks for minutes. Answer **fifteen minutes**; a bounded resolver returns the specific delay tool without another model call.
4. Review full finish 08:28 versus retained-work finish 08:16. Laundry stays pending until consent. A natural-language yes opens review, rather than applying the trade-off.
5. Choose **Approve this revision**. The confirmed MCP tool keeps departure 08:20 and marks laundry deferred and unfinished. Completed reports stay intact. Reload or restart to inspect saved state.
6. In a separate demo, load **3 · Essential laundry** and report the same delay. There is no deferral option; later departure requires agreement.
7. **Review system** exposes actual protocol discovery, selected tools, provider receipts and checked constraints. Direct controls are distinguished from AI interpretation.

Task times are editable estimates, not measured real-world savings. Passing time never completes a physical chore. One or two adults, up to eight tasks, integer minutes, prerequisites, passive waits, availability and a final check are supported. Bounded search can report uncertainty.

## Independent MCP client

With the app running, use another terminal:

```powershell
node scripts/mcp-demo.mjs
node scripts/mcp-demo.mjs --live
```

The first uses typed tools without an LLM. The second uses actual server-configured inference and scoped clarification. Both create a private seeded guest session and exercise initialization, discovery, recovery, scripted confirmation and essential-task protection. They print no auth tokens or provider keys. Scripted confirmation is a protocol test, not human-approval evidence. Set `READYBY_SERVER` for a different loopback port.

The endpoint is `/mcp`; `GET /api/mcp` describes it for an authenticated household. The simulator uses a household session plus `X-CSRF-Token`; the CLI is a complete client example. This is not native Alexa OAuth account linking or certification.

## Verify

```powershell
node --test
pnpm typecheck
pnpm build
node scripts/benchmark-providers.mjs groq --full --fallback
node scripts/backup.mjs
node scripts/restore-check.mjs backups/<snapshot>.sqlite
```

The benchmark invokes hosted providers and consumes quota; offline unit/API tests do not. Latest evidence: [MCP verification](READYBY_MCP_VERIFICATION.md). The selected hosted pipeline passed the declared 30-request development corpus: median 1,047 ms and p95 3,821 ms in one run. This is not a generalization or production-latency guarantee. Initial failures remain recorded. The historical scheduling oracle passed 48/48 small cases; it was not rerun for this transport change.

Operations: [local operations](READYBY_V2_OPERATIONS.md). Legacy entry points remain `pnpm prototype` and `pnpm legacy`; they do not represent this MCP-enabled product.

## Submission scope

Primary: Alexa+ self-hosted MCP, demonstrated through our simulator. Optional Open Source candidate: [IntentSeal](https://github.com/sankalp2515/intentseal), a separate public contribution, not integrated into ReadyBy. No AWS mini-challenge claim is made.

The source repository is https://github.com/sankalp2515/ReadyBy. Publication does not complete the Devpost entry. Final public working-demo video, reviewer access, Devpost fields, eligibility and media rights still require completion. Older films/capture walkthroughs are historical and must not be represented as a continuous recording of this system. Customer adoption, commercial ROI and prize probability are unmeasured.
