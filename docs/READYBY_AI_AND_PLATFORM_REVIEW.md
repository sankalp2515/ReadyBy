# ReadyBy: AI trace and platform research (historical)

**Superseded by ReadyBy 0.3 implementation. Read READYBY_MCP_VERIFICATION.md for the actual MCP connection, hosted providers and current results. The original research below records the earlier state.**

23 October 2026. This review distinguishes verified implementation from proposed work. No MCP adapter, AWS integration, native Alexa connection or IntentSeal integration was implemented by this review.

## Where AI actually runs

The household browser sends an authenticated `/api/command` request. In `src/platform/server.mjs`, an applicable bounded clarification resolver can handle a short answer; otherwise `interpret()` in `src/readyby/agent.mjs` makes an actual HTTP POST to the local Ollama `/api/chat` endpoint. It sends mission context and the latest request, requesting schema-constrained JSON from `llama3:8b-instruct-q4_K_M`. The intent is validated and translated into domain actions. Deterministic scheduling and independent verification, rather than the LLM, determine feasibility and finish times. Persisted receipts distinguish AI, policy/clarification and direct domain actions.

The model was already available through this machine's local Ollama installation. A fresh request on 23 October returned `{action: delay, taskId: laundry, minutes: 15, kind: release}` for “The washer still has fifteen minutes left.” It took **23,345 ms**. The trace is `docs/evidence/ai-trace/live-model-request.json`. This check invokes the real interpreter with a rehearsal fixture, without mutating the household database; it is not another complete browser test. The prior complete browser evidence remains separately recorded.

Optional Vosk speech recognition is a local acoustic/language-model pipeline, not the LLM. Browser speech synthesis uses an installed local voice. Direct task controls, scoped explicit-duration clarification, schedule search, constraint checking, SQLite persistence and seeded demo chapters do not call the LLM. Replies and explanations are mostly grounded application text, not a separate free-form generation call. Completion always needs a household report.

## Why no hosted LLM key was requested

The current model is local: approximately 4.92 GB of quantized 8B weights, served on loopback port 11434. The default implementation has no hosted-provider API key requirement or paid inference account. Installation requires downloading software and weights; this is not zero setup or zero compute cost. If a hosted provider is added, its server-side credentials, billing/permissions, model access and measured behavior must be configured and verified. Never put provider credentials in frontend code. AWS Bedrock would require AWS authentication/model access, rather than merely adding a generic LLM key.

Source: [Ollama authentication documentation](https://docs.ollama.com/api/authentication).

## Eligibility versus competitiveness

The [official rules](https://amazonappdev2026.devpost.com/rules), §4, permit an Alexa+ simulation using any AI/agentic tool, without an MCP-shaped surface, and exempt that route from the runtime technology hook. AWS is an optional separate mini-challenge. This is an authorized entry path, not a missing mandatory technology requirement. The [FAQ](https://amazonappdev2026.devpost.com/details/faqs) says native Alexa tooling is gated and a real web MCP client is an accepted demonstration route.

However, a competitor with an equally strong customer solution, working interoperability and a faster interaction has a stronger technical/platform story. A local web simulation with slow intent extraction does not establish native readiness. My earlier categorical recommendation to keep MCP out should be narrowed: avoid a decorative wrapper, but a tested real adapter is the highest-value remaining platform addition. Eligibility alone is not a winning strategy.

## Research conclusion: position the difference accurately

Alexa+ already supports task lists, assigned/recurring/follow-up reminders and voice-created routines. ReadyBy should not pitch these as new. Its proposed differentiated job is repairing a shared deadline after a disruption while preserving actual progress, constraints and user control. The sources below establish adjacent Alexa capabilities; they do not prove that no competing planner performs similar recovery, nor do they validate household demand or revenue for ReadyBy.

- [Amazon: managing reminders and tasks](https://digprjsurvey.amazon.co.uk/csad/help/node/T30e4eImkYHXKiYbvr)
- [Amazon: routines by voice](https://digprjsurvey.amazon.co.uk/csad/help/node/TR10VgRL0uV9H384FM)
- [Amazon: Alexa+ capabilities](https://www.aboutamazon.com/news/devices/new-alexa-top-features)

Customer job: a parent needs a realistic answer to “can we still leave on time, and what must change?” The business hypothesis is that useful recovery creates repeat household engagement. Retention, coordination effort, missed departures and willingness to pay are unmeasured; do not invent ROI.

## Recommended next implementation — not completed

1. Add a real MCP server at a loopback endpoint using protocol 2025-11-25 or newer and Streamable HTTP. Reuse shared guarded domain services rather than implementing a second scheduling engine. Bind tools to the authenticated household and mission.
2. Provide tools to inspect a mission, report explicit progress, update constraints, request checked recovery and commit a specifically approved proposal. Preserve revision/idempotency checks, scoped task IDs, essential-task protection and explicit physical reports. A model-supplied `approved: true` is not proof of human approval; use a confirmation bound to the exact proposal/revision.
3. Route the simulator's model-selected tool actions through an actual MCP client. Demonstrate `initialize`, `tools/list` and `tools/call` with real request/result receipts. A second independent SDK client should discover and use the same tools. A renamed REST endpoint is insufficient proof of MCP.
4. Test the negotiated protocol, transport headers, tool errors, unauthenticated/cross-household requests, invalid origins, stale approval and duplicate writes. Confirm current domain tests still pass and the final browser flow actually uses MCP. This remains a self-hosted server demonstration, not a certified native Alexa add-on; native remote URL/OAuth onboarding is separate gated work.
5. Benchmark the existing local inference configuration before changing providers. The fresh 23.345-second result is too slow for an effortless voice claim. Preserve fast bounded follow-ups and direct controls, but label those paths honestly. A faster alternative must pass the same semantic and consent checks; do not promise latency improvement without measurements.

References: [MCP transport specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports), [MCP tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools), [Alexa+ MCP requirements](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-quickstart). Protocol connectivity does not grant access to Amazon's gated tools.

Do not add AWS simply for a logo or an unmeasured provider change. If actually implemented for a specific role and documented, AWS can support its mini-challenge; no AWS use is currently claimed. IntentSeal is the selected existing Open Source candidate, replacing the earlier proposed checker-library contribution; do not claim it protects ReadyBy without an actual integration.

## Demonstration that proves the product

Show the checked 08:19 opening plan for an 08:20 departure. Label the seeded 08:06 chapter and reported progress. Make a real washer update; show full finish 08:28 and retained-work finish 08:16. Show that laundry remains pending before approval and unfinished after deferral. Reload the saved result. In the separate essential-laundry counterexample, show that deferral is refused. Briefly expose the raw interpreted action, actual tool result and independent verification. If MCP is added, prove the transport in this same workflow; do not substitute a separate disconnected protocol demo. Disclose cuts and elapsed inference time.

## Diagram and verification

`docs/architecture/readyby-actual-architecture.svg` is editable, and the matching PNG follows the supplied reference's navy/orange grouped-component style. The drawing describes current implementation and clearly labels MCP as a proposed step. Regenerate both with `python scripts/render-architecture.py`. Code mapping is in `docs/architecture/README.md`.

The review added documentation, the architecture renderer and a fresh model trace; it did not change product runtime logic. Previous 48-test/typecheck/build results remain the latest product checks, not fresh results from this review. No hosted deployment, key configuration, video upload or entry submission was performed.
