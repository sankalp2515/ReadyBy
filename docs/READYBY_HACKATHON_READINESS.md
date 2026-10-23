# ReadyBy submission readiness — 23 October 2026

**The 0.3 implementation now includes a real MCP server/client and hosted AI. The remaining submission gates are delivery and access.** See `READYBY_MCP_VERIFICATION.md` for evidence and limitations.

Requirements reviewed against the [official rules](https://amazonappdev2026.devpost.com/rules) and [FAQ](https://amazonappdev2026.devpost.com/details/faqs). Organizer decisions control eligibility and selection. Deadline: **24 October 2026, 00:30 IST** (23 October, 12:00 PDT).

| Gate | Status |
| --- | --- |
| Working Alexa+ project | Real self-hosted MCP, protocol 2025-11-25, Streamable HTTP, 13 tools; demonstrated through the permitted web simulator. Native Alexa access is not claimed. |
| Technical verification | 56 passing tests; typecheck/build and independent MCP-client recovery passed from isolated source without development secrets or data. |
| Actual AI evidence | Selected hosted pipeline 30/30 declared development cases; median 1,047 ms, p95 3,821 ms. Raw failures and policy corrections retained. |
| Interface and demo | Desktop/phone checks, clarification, review-only natural consent, approved recovery, persistence and essential-task counterexample verified. Live human speech rehearsal remains pending. |
| Repository | Owner selected the public MIT repository [sankalp2515/ReadyBy](https://github.com/sankalp2515/ReadyBy) and authorized source/profile/release publication. Verify the final public repository and v0.3.0 release links before entering them. |
| Final public video | Under-three-minute current recording and YouTube/Vimeo upload pending. Screenshots and CLI evidence support rehearsal but do not replace this requirement. |
| Judge access | Locally runnable source plus video is sufficient per the official FAQ; a continuously hosted MCP server is not required. Preserve free repository/test access through judging and document model setup. Keys stay out of source and recordings. |
| Entry/rights | Owner verifies entrant/team details, eligibility, rights/attribution and submits final fields. |

## Judging case

The four dimensions are equally weighted; Tech Implementation is the first tie-break dimension.

| Dimension | Evidence to demonstrate | Remaining limitation |
| --- | --- | --- |
| Tech Implementation | Actual MCP initialize/list/call; actual provider receipt; deterministic schedule plus independent verification; exact-proposal consent; revision/idempotency; saved progress. | Loopback simulator authentication, not native OAuth or production deployment. |
| Design | Calm shared household display; visible deadline and consequences; responsive layout; transcript review and dedicated inspection. | Human microphone/voice-output rehearsal still needed if featured. |
| Potential Impact | Repeated household coordination problem; reusable routines; realistic recovery without erasing progress. | Customer demand, adoption, retention and commercial outcomes unmeasured. |
| Quality of the Idea | Protect essential work and preserve truthful execution state when recovering a shared deadline. | The demonstration must show the essential-task refusal, not just the happy path. |

No shortlist probability or guaranteed win can be supported. Adding an AWS logo or an unnecessary cloud call would not close the real evidence gaps.

## Mini-challenges

**Open Source:** selected candidate is the separate public Apache-2.0 IntentSeal project. Include repository URL, substantive contribution URL, GitHub identity and developer-benefit description from `READYBY_SUBMISSION.md`; confirm entrant rights. Its reviewed event-window history supports candidacy. Integration with ReadyBy is not claimed and is not required by the broad contribution rule. Submission and selection remain pending.

**AWS Builder:** defer. No qualifying AWS integration or Kiro Crew development use is demonstrated. Do not describe Codex work as Kiro work or claim an installed CLI is an integration.

## Final demonstration sequence

Keep the film under three minutes. Establish 08:20 and checked 08:19; label seeded 08:06 progress. Make a real incomplete washer request, answer the missing-minutes question, and compare full finish 08:28 with the proposed 08:16 recovery. Show laundry pending before review; natural “yes” opens review; explicit confirmation defers it without claiming completion. Inspect actual MCP/provider receipts and reload the result. In a separate labelled essential-laundry chapter, show that deferral is unavailable and the departure remains unchanged without approval. Keep real elapsed time or label cuts. See `READYBY_DEMO_RUNBOOK.md` for the capture script.
