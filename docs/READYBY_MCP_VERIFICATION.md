# ReadyBy 0.3 — MCP and hosted inference verification

23 October 2026. This is the implementation evidence for the public ReadyBy v0.3.0 source release, not a completed Devpost submission or a native Alexa add-on.

## Implemented path

The household React app is an actual official-SDK MCP client. It negotiates protocol **2025-11-25**, discovers **13 tools**, and sends tool calls over **Streamable HTTP** to `/mcp`. The first-party connection is authenticated with the household session and CSRF header. The server is stateless at the protocol transport layer; household state remains persistent in SQLite.

Conversation is two calls: `readyby_interpret_request` uses a real configured model or bounded clarification rule, then returns a short-lived prepared call. The browser invokes the selected typed household tool with that prepared call. The server binds it to the session, household, mission, revision, request key and exact arguments. Altered, expired or cross-session calls fail. Direct UI controls use the same typed tools without a language-model request. The independent `scripts/mcp-demo.mjs` client uses the official SDK, rather than the browser implementation.

Tool surface: inspect mission, interpret request, report progress, report delay, edit task constraints, set availability, recalculate, start/revise a draft, reject/commit a proposal, advance demo time and resume deferred work. Authentication/onboarding, mission creation and explicitly labelled rehearsal seeding remain ordinary first-party endpoints.

Natural-language consent opens review; it cannot itself apply a deferral or later deadline. The dedicated authenticated review endpoint issues a two-minute, single-use confirmation bound to the exact proposal and revision. The MCP tool set cannot mint that token. This assumes the first-party review interface/session is trusted; it is not cryptographic proof of human presence or production OAuth account linking. Confirmation/prepared tokens are not recorded in domain state or public evidence.

## Hosted inference decision

The owner authorized Groq, Gemini and NVIDIA keys in the server's ignored `.env`. Node loads that file at startup; keys are never returned to the browser, placed in URLs, copied to evidence or included in the source export. Shell environment settings take precedence. The selected configuration is **Groq `openai/gpt-oss-120b`**, with **Gemini `gemini-3.1-flash-lite`** fallback. Quota responses start a provider cooldown. Receipts identify the actual provider, model, attempts, latency, raw intent and any deterministic normalization. There is no silent model substitution after a semantic failure.

Hosted calls send the latest request and bounded mission context, including task and participant names, to the selected provider. Microphone audio is recognized locally with Vosk; its reviewed text can then be sent to hosted inference. The household display labels cloud AI. Selecting `READYBY_AI_PROVIDER=ollama` keeps inference local and disables hosted fallback. No hosted keys are included in the export. Without keys, the default auto mode uses an installed Ollama model, or leaves AI unavailable while direct household tools work.

## Measured results

| Evidence | Result and limits |
| --- | --- |
| Final selected provider pipeline, declared 30-utterance corpus | **30/30**, median **1,047 ms**, nearest-rank p95 **3,821 ms**. Actual providers: 17 Groq and 13 Gemini calls. Raw intents and normalizations retained in `groq-fallback-full.json`. This is a small, prompt-informed development corpus, not an independent generalization benchmark. |
| Earlier provider runs | Groq 20B was fast but quota-limited and had semantic mismatches. Groq 120B alone encountered quota failures. Gemini's earlier runs had a recalculation mismatch, a passive-wait mismatch and quota/request failures. NVIDIA screening passed one of six requests; the others failed/time-limited. These reports remain in the evidence directory. NVIDIA is not selected for automatic fallback. |
| Earlier local reference | A single local Llama request took **23,345 ms**. This is historical context, not a paired 30-case speed comparison. |
| Actual household browser | Missing-duration request used Groq in **947 ms**; explicit follow-up used the bounded resolver (**0 ms**, no second model call); natural-language approval used Groq in **612 ms** and opened review without applying it. The review button committed through `readyby_commit_proposal`. |
| Independent SDK client | `independent-typed.json` and `independent-live.json` show initialization, tool discovery, actual typed calls, checked recovery and essential-task protection. The CLI uses scripted fixture setup and confirmation; it is not a human microphone demonstration. |

Actual browser approved mission: `68af6915-172b-4f01-a143-58b8db1b0578`. The labelled 08:06 chapter preserves bag/lunch completion, models full finish 08:28, proposes retained work finishing 08:16 and keeps the 08:20 deadline until review. Cancelling review leaves laundry pending. Approving marks it deferred and unfinished, with both completion facts intact. Page reload restored the result. A separate browser-created demo mission exercised essential laundry through another actual model request; the interface offered a later 08:28 departure only, leaving 08:20 unchanged without approval.

Automated test/build/export results and the final restart/layout checks are recorded in the completion section below. Unit/API tests use doubles where stated; they are separate from live provider and browser evidence. Live human speech, output listening quality, load capacity and customer demand remain unmeasured.

## Completion checks

The isolated source export installed 118 packages from the frozen lockfile, passed TypeScript checking and the production build, and passed **56/56 tests** with no skips. A fresh in-memory database and ephemeral loopback server completed the independent typed MCP demo without `.env` or development data: protocol 2025-11-25, 13 tools, recovery and essential protection. This is the same Windows host, not a second-device test.

Actual browser checks passed at 1920×1080 and 390-pixel phone width, with no document overflow. The approved mission and separate essential case survived a real server restart. The MCP trace retains initialization/discovery and recent actions despite automatic polling. Configured credential values were absent from all five frontend JavaScript assets. See `READYBY_EXPORT_VERIFICATION.md` for packaging scope and `evidence/mcp-integration/tests.tap` for test output.

## Reproduce

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
node --test
node app-server.mjs
# another terminal:
node scripts/mcp-demo.mjs
node scripts/mcp-demo.mjs --live
```

The typed CLI does not invoke an LLM. The live CLI uses the server's configured provider and makes a private seeded demo session. To evaluate the selected hosted pipeline separately, use `node scripts/benchmark-providers.mjs groq --full --fallback`; this invokes paid/quota-limited providers configured by the operator. Do not run a benchmark immediately before filming if a free-tier quota may be exhausted.

This server uses loopback/session authentication for its simulator. It is not deployed to native Alexa, does not implement native Alexa OAuth account linking, and has no AWS or IntentSeal runtime integration. IntentSeal remains the separate Open Source contribution candidate. The official SDK transport and protocol are real; a production Alexa deployment would need the separately gated onboarding, remote endpoint and authentication work.

## Evidence directory

`docs/evidence/mcp-integration/` contains provider reports, automated TAP results, independent-client traces, actual browser receipts and screenshots. Only selected, non-secret evidence is exported. Private databases, session records, model keys, installed environments and backups are excluded.

Current architecture: `docs/architecture/readyby-actual-architecture.svg` and matching PNG. The new `docs/evidence/readyby-mcp-evidence-walkthrough.mp4` is an 83.5-second narrated montage of actual captured product states, not a continuous recording or the complete live-conversation demonstration. Submission fields and final public video/repository delivery remain owner-controlled.
