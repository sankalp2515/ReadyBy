# ReadyBy 0.2 verification and release decision

23 October update: current UI, speech, conversation and test evidence is in [film integration verification](READYBY_FILM_INTEGRATION_VERIFICATION.md). The earlier evidence below remains historical.

22 October 2026. Local authenticated private beta. Everything remains local; there is no published repository, hosted customer service, video upload or final submission.

## PM decision

**Submit the upgraded build as a credible functional entry after updating the final demonstration and review access. Do not call it a proven market launch or forecast a shortlist.**

The original version underrepresented the implementation and looked like a prepared demo. Version 0.2 adds a complete first-use path and repeat-use household workflow. The highest-value distinction remains checked recovery from a changed constraint, rather than the presence of accounts or an attractive checklist. Fifty-nine thousand registrations do not provide evidence of the number or quality of completed entries.

| Official criterion (equal weighting) | What this version establishes | Remaining weakness |
|---|---|---|
| Tech Implementation | Actual local AI tools; deterministic recovery plus independent checker; household authorization; transactional storage; revision and retry handling; restore rehearsal. | Model latency, broad language reliability and deployed concurrency are not production-validated. |
| Design | Coherent onboarding and household workspace; decision-first recovery; proportional timeline; explicit approvals; custom task/routine flows; phone layouts. | Full screen-reader, keyboard and contrast audit remains open. Native Alexa voice is simulated. |
| Potential Impact | A reusable everyday job for adults coordinating a departure; custom estimates, priorities and saved routines support actual use. | No observed household outcomes, retention or willingness-to-pay data. Potential impact is a hypothesis. |
| Quality of Idea | Demonstrates a constrained agent that preserves essential work, reports an impossible deadline and maintains progress. | General household planning is crowded. Do not claim the entire category or algorithm is novel. |

The [official rules](https://amazonappdev2026.devpost.com/rules) and [FAQ](https://amazonappdev2026.devpost.com/details/faqs) permit the disclosed Alexa+ simulation route. Native integration and guaranteed prize outcomes are not claimed.

## Completed verification

- Strict TypeScript checks, including unused imports/parameters, pass. Vite production build passes; JavaScript bundle about 89 kB gzip, CSS about 10 kB gzip in the current build.
- **44 automated tests pass:** 31 ReadyBy/platform tests and 13 retained historical tests. The suite covers scheduling, consent, progress, malformed constraints, storage, API boundaries and household access.
- **48/48 independent small-case scheduling oracle comparisons pass.** This is bounded evidence; it does not prove all eight-task searches globally optimal.
- Household isolation: a second account cannot select/read/mutate a foreign mission. Owner-only operations reject members. Unknown membership cannot switch households.
- Authentication: passphrase hashing, HttpOnly SameSite session cookie, CSRF and origin checks, sign-out invalidation, rotating one-use recovery code and invalidated old sessions.
- Invitation and membership: one-use code, scoped member access, removal invalidates relevant sessions, multiple joined workspaces can be selected.
- Integrity: stale writes and in-flight model races reject; repeat requests return saved results; failed transactions roll back; data persists after reopening; newer schema version is rejected rather than downgraded.
- AI failure returns an actionable error without changing mission work; direct controls remain usable. Tests with interpreter doubles are not live AI evidence.
- Actual browser AI recovery: fifteen-minute washer report, full finish 08:28, proposed deferral finishing 08:16, approval preserving 08:20; restored after a server restart. Actual receipt latency **17,760 ms**.
- Actual browser essential case: same washer update with laundry required; only later departure offered. Actual receipt latency **15,988 ms**.
- Browser product flows: private demo onboarding, routine to new mission, saving a routine, custom two-task mission with prerequisite, mission switching, starting, proposal review/approval, household management, and visible prerequisite error inside a modal. The rejected completion leaves the prerequisite unconfirmed.
- Responsive checks at **390 × 844** and **320 × 740**: no horizontal page overflow. The timeline may scroll horizontally within its own region. Approval modal remains usable. Temporary viewport override was reset.
- Operational rehearsal: consistent SQLite backup created using VACUUM INTO; integrity check `ok`, zero foreign-key violations. A copied backup was opened by a separate app process on port 4174 and verified in the actual browser: same 08:20 deadline, 08:16 planned finish, retained reported progress and deferred laundry. Rehearsal process was stopped afterward.

## Evidence

- `docs/evidence/tests.tap` — final test output.
- `docs/evidence/system-evaluation.json` — independent oracle report.
- `docs/evidence/v2/actual-browser-ai-recovery.json` — saved actual AI/approval state.
- `docs/evidence/v2/actual-browser-essential-case.json` — actual model/essential case.
- `docs/evidence/v2/` — actual desktop, phone, receipt, error and restored-backup captures.
- `docs/design/v2-working-concept.png` and `docs/design/V2_DESIGN_INVENTORY.md` — design reference and fidelity decisions.

The historical 30-utterance live-model corpus remains **29/30**. Its failure maps “Please check the schedule again” to status instead of recalculate. This pass did not rerun that entire corpus or claim arbitrary language accuracy. Current browser runs are additional specific evidence, not a replacement for it.

Browser logs included extension-origin warnings and one asynchronous message-channel error without an application stack. We have not described the session as a clean-console or independent accessibility/security audit.

## Skills and plugins

Official curated skills installed locally: `security-best-practices`, `security-threat-model` and `playwright`, under `C:/Users/sanka/.codex/skills/`. They become available to the skill catalog in a subsequent session/turn. Existing frontend-design guidance, image generation and browser tools supported this pass. A security skill installation is not a security audit.

Product Design was subsequently installed and used for a fresh in-app audit; findings, fixes and recaptures are in READYBY_PRODUCT_DESIGN_AUDIT.md. Codex Security installation/connection remains unconfirmed. No cloud account, paid service or external permission is required to run this local build. We did not claim those plugins performed a review.

## Open public-launch gates

Tested HTTPS hosting and proxy configuration; actual hardware/model latency and capacity; independent security review; full accessibility validation; account/guest quotas and cleanup; privacy/retention/support policy; backup retention and incident ownership; and observed target-household results. The code includes local controls and a production configuration guard, but these external operational gates remain unverified.

A completion report is not a departure report. A calculated buffer is not measured minutes saved. Suggested eventual impact measures are self-reported departure outcomes, repeated voluntary use, planning burden and abandonment, with an explicit comparison baseline. No values are invented here.

Updated local walkthrough: `docs/evidence/readyby-v2-walkthrough.mp4`, 136.7 seconds, narrated actual product captures. It is not a continuous screen recording and does not replace a live test. No video upload was performed.

The finished walkthrough was checked with ffprobe: H.264 video, AAC audio, 1920 × 1080, 136.84 seconds. A rendered frame was inspected. It is a narrated captures artifact; a continuous final recording of the live recovery remains the more persuasive submission option.

Product Design follow-up: screenshot-based recovery audit completed with fresh evidence; corrected saved-work wording/context, markup order, review-action naming and voice information affordance. Dialog accessible naming and keyboard wrapping were retested. The audit observed a further real model request at 24,419 ms; the earlier two timings do not bound latency.
