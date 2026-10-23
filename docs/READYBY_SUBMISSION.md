> Historical version 0.3 draft. Use [the current Devpost copy](READYBY_DEVPOST_FINAL.md), [judge guide](JUDGE_GUIDE.md) and [submission checklist](READYBY_SUBMISSION_CHECKLIST.md). This document records earlier scope and is not current submission guidance.

# ReadyBy — submission draft, version 0.3

Prepared on 23 October 2026. Source repository: [sankalp2515/ReadyBy](https://github.com/sankalp2515/ReadyBy), release v0.3.0. Final public video upload and Devpost submission remain pending. Start with `READYBY_FINAL_HANDOFF.md` and `READYBY_MCP_VERIFICATION.md`.

## One-line description

ReadyBy repairs shared household plans when time slips, preserving reported progress and asking before changing commitments.

## Inspiration and customer problem

A school departure is a coordination problem: people share limited time, chores have dependencies, and a washer can keep working while someone does something else. When one estimate changes, somebody has to rebuild the plan mentally. ReadyBy maintains a checked execution plan and admits when the original departure no longer works.

## What it does

In the editable demonstration fixture, two people can complete seven tasks by 08:19 for an 08:20 departure. At the labelled 08:06 chapter, reported bag and lunch completion are preserved. A live washer update makes the full plan finish at 08:28. ReadyBy asks for missing minutes, proposes moving flexible laundry until later, and computes remaining departure work finishing at 08:16. The departure and task commitments change only after explicit review. Deferred laundry remains unfinished. If laundry is essential, ReadyBy refuses that shortcut and offers an honestly later departure instead.

These are computed results under supplied estimates, not measured household savings or a guarantee that physical chores will finish on time. A timer cannot report task completion.

## How we built it

The React/TypeScript Alexa+ simulator is a real official-SDK MCP client. It initializes protocol **2025-11-25**, discovers **13 tools** and invokes typed actions through an authenticated Streamable HTTP endpoint. Conversation first obtains a validated, short-lived prepared call, then executes the selected tool. Direct controls use the same household tools. Independent SDK-client traces demonstrate interoperability outside the browser implementation.

Real Groq GPT-OSS 120B interpretation uses Gemini Flash-Lite fallback when configured. Receipts show the actual provider/model, latency, raw intent and policy normalizations. Server-side keys never reach frontend assets or the source export. Local Ollama remains an alternative; optional Vosk speech recognizes audio locally and lets users review the transcript.

The LLM interprets language. A bounded deterministic scheduling search handles dependencies, participant capacity, passive waits and deadlines. An independent checker verifies candidate schedules. SQLite transactions, household authorization, revision checks and request idempotency preserve state. Consequential proposals require a short-lived confirmation tied to the exact proposal and revision; saying “yes” only opens review.

## Validation and lessons

The selected hosted pipeline passed all 30 declared development utterances, with median 1,047 ms and p95 3,821 ms. This small prompt-informed corpus includes deterministic validation and is not a held-out benchmark. Earlier semantic and quota failures are retained. NVIDIA screening was unreliable in this environment and is not an automatic fallback.

All 56 automated tests, TypeScript checking and a production build passed in a fresh source export. An independent MCP client exercised recovery and essential-task protection without the development `.env` or database. Actual browser requests took 947 ms and 612 ms; bounded clarification avoided another LLM call. Desktop and phone layouts, reload and server restart were checked. Human microphone quality and production load remain unmeasured.

## Differentiation and potential impact

Our focus is checked recovery of a shared deadline: preserve execution facts, model waits separately from effort, protect essentials, and ask before changing commitments. The failure case is part of the demonstration. This is a product hypothesis with working technical evidence, not a claim that no competing assistant has related features.

The recurring, hands-busy departure workflow could create repeat Alexa use and reduce household coordination effort. Customer adoption, retention, stress reduction, willingness to pay and revenue have not been measured. Future validation should observe repeated departures, missed essentials, manual interventions and voluntary reuse.

## Track and honest scope

Primary entry: **Alexa+ — working self-hosted MCP server demonstrated through a web simulator**. The MCP transport and model requests are real. No native Echo connection, Alexa OAuth account linking, appliance telemetry, push notifications, AWS deployment or IntentSeal runtime integration is claimed. Remote/native deployment requires additional onboarding and authentication work.

## Open Source mini-challenge candidate

Separate project: [IntentSeal](https://github.com/sankalp2515/intentseal), Apache-2.0. GitHub identity: `sankalp2515`. Suggested substantive contribution permalink: [intent-contract contribution](https://github.com/sankalp2515/intentseal/commit/43a188ca68deca6aa2ebd662db20490e596cc67a). Explain its developer benefit accurately: inspect untrusted content, check actions against explicit intent contracts and retain execution evidence. Confirm the entrant's authorship/rights and use the reviewed event-window contribution. It is a separate candidate; no mini-challenge entry has been submitted.

## Delivery gates

- Verify the public GitHub source and MIT license are accessible, then enter the source URL in Devpost.
- Public YouTube/Vimeo video **under three minutes**, showing this 0.3 implementation. Older visual films do not establish the current runtime.
- Reproducible, free judge access through the required judging period. The official FAQ accepts locally runnable source plus video; hosting and a continuously running MCP server are not required. Document local Ollama or hosted-provider setup. Never publish API keys; optional private hosted-demo access needs its own testing instructions.
- Entrant/team details, eligibility, attribution/rights and final Devpost fields.
- Select genuine platform feedback for the optional feedback field; assessment is at the organizers' discretion.

Do not describe the local implementation as a completed public submission or a market-launch-ready native Alexa product.
