# ReadyBy developer feedback and friction log

Draft based on actual work on 22–23 October 2026. Version 0.3 now uses the official generic MCP TypeScript SDK; no gated native Alexa SDK/MCP Toolkit or native Echo connection was used. The local-model observations below are historical; current results are in READYBY_MCP_VERIFICATION.md.

## Ollama API and local model

Use: local structured intent extraction through `/api/chat`; `/api/tags` reports configured-model availability. No external household APIs or paid model key were necessary in this development environment because suitable weights were already installed.

Worked well: simple HTTP integration, temperature-zero structured output, local data path, no additional JavaScript packages. Our first real request correctly extracted a washer delay. Actual intent/latency evidence is saved separately.

Needs work: schema-valid JSON can still select semantically incorrect fields/actions. The initial Llama evaluation passed 13/20 declared cases; prompt/schema improvements raised an intermediate run to 18/20. A tested larger model was slower and performed worse on that set. These are narrow internal evaluations, not general model benchmarks. Preserve all final reports and update this account if implementation changes.

Onboarding: detected an existing Ollama service and installed models. A Windows launcher on PATH opened the GUI rather than behaving as the expected CLI. Verified actual endpoints instead of assuming command success.

Final pipeline result: 29/30 strict cases passed, with raw intent and policy corrections preserved. The remaining phrase produced fresh status rather than the requested proposal regeneration. See READYBY_EVALUATION.md; this is not a claim of unaided model accuracy.

Would use again: yes, for dependency-light local demonstrations, with strict validation and measured hardware-specific latency. We would not delegate authoritative feasibility or physical completion to a model.

## Node.js built-in server and test runner

Use: loopback HTTP server, deterministic engine, atomic local snapshots, tests and evaluation scripts. The initial prototype required no npm install/build; the current React application uses the locked pnpm build documented in README.

Worked well: small reproducible runtime, independent unit/API tests, straightforward persistence restart verification.

Needs work: local npm launcher was misconfigured in this environment in earlier prototype work. Direct Node entry points worked; README uses those commands. Built-in HTTP requires deliberate body, origin, storage and error handling.

Would use again: yes for this bounded local prototype. A public multi-household service would need authentication, isolation and deployment work beyond this loopback implementation.

## Alexa ecosystem / onboarding feedback

Use: researched official voice/multimodal guidance and hackathon requirements. No access to gated native add-on tools was assumed.

Worked well: official simulation allowance made a stateful household prototype feasible without Echo hardware or partner onboarding.

Needs work: native setup documentation can suggest tooling that participants cannot access; the hackathon FAQ clarifies the restriction. A prominent eligibility/access notice and a runnable simulation example beside setup instructions would reduce false starts.

Would build again: yes, using the permitted simulation path while native access remains restricted. Native integration is future work, not a completed feature.

## Actual friction entries

| Task | Steps / expected | Actual | Severity / workaround | Actionable suggestion |
|---|---|---|---|---|
| Local model discovery | Run installed `ollama list`; expect CLI model list | Installed launcher opened app/logged startup | Moderate; query `/api/tags` on the local service | Make launcher/CLI paths and command diagnostics explicit in Windows onboarding |
| Duration/time interpretation | Ask for draft departure and duration updates; expect correct structured fields | Early evaluation produced wrong time arithmetic and wrong action/field | Important; extract time string, calculate deterministically, strengthen examples and validation | Provide task-specific structured-intent examples and semantic evaluation guidance |
| Model selection | Compare existing local models using the same declared cases | Larger model was slower and less accurate on this narrow task | Moderate; retain measured smaller-model path | Surface task-specific latency and action-level evaluation, not only JSON validity |
| Native Alexa onboarding | Read setup documentation alongside event requirements | Access to partner tools unavailable to hackathon entrants per official FAQ | Important; use explicitly permitted simulation | Repeat access prerequisites at the top of every setup path |
| Judge form interaction | Click delay recalculation in actual browser; expect domain action | Initially submitted a native form instead of invoking engine | Moderate; added handler and retested UI result | Internal lesson: include every form in browser rehearsal, beyond engine tests |

Only Amazon/platform-relevant friction should be selected for the official feedback field. Internal product defects and unrelated tools are documented for transparency, not automatically claimed as bonus-eligible entries.

## 23 October: actual MCP and hosted inference

The official MCP TypeScript SDK 1.32.1 now powers both browser/client and Streamable HTTP server. An independent SDK client negotiated protocol 2025-11-25 and discovered 13 tools. Initialization, discovery and calls are retained in inspectable traces. A practical integration lesson was to preserve the handshake despite repeated state polling, and to keep exact-proposal confirmation outside the agent's tool authority.

Groq was fast but encountered 429 quota responses during a 30-case run. Gemini provided useful configured fallback; its earlier outputs also needed semantic guards for recalculation and passive wait interpretation. NVIDIA screening was unreliable in this environment. We added explicit provider attempts, safe errors and quota cooldown rather than treating configured keys as proof of availability. The final selected pipeline passed 30/30 development cases at median 1,047 ms, with limitations and earlier failures retained.

Developer recommendation: show protocol/version, actual provider, transport errors and quota state explicitly in runnable examples. JSON-valid output is not sufficient evidence of correct action semantics. This feedback is based on our implementation; eligibility for any event feedback bonus remains the organizers' decision.

## 23 October: simulation and speech integration

Added an actual local Vosk speech worker, browser microphone/recorded-clip input, transcript review and installed local voice output. The official model archive is checksum verified. This is our own simulation input path; no native Alexa speech SDK is claimed. A synthetic Microsoft Zira Desktop clip was correctly recognized as “fifteen minutes” through both the service and browser file flow. Human microphone accuracy remains unmeasured.

An actual local Llama request “The washer needs more time” returned an ungrounded 12-minute delay. The application guard blocked it, asked for explicit minutes, and kept the mission unchanged. The raw/corrected intent is retained. A scoped follow-up resolved without a second model call; natural-language approval then used an actual model request and committed the matching proposal. Observed AI latencies were 20.426s and 18.878s; synthetic service recognition after restart took 0.861s. These are individual observations, not benchmarks.

Platform documentation friction: selecting a permitted Alexa+ entry path required cross-checking the resource page, official repository requirements and FAQ. The resource introduction emphasizes MCP; the official rules also permit an AI-tool simulation without an MCP-shaped surface. Request: show a single explicit entry-path table and runnable simulation starter, including input, tool receipts, state persistence and approval examples. This is observed documentation navigation friction, not a claim that an unavailable native SDK failed in our runtime. Bonus assessment remains the organizer’s decision.
