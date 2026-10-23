# ReadyBy evaluation — completed local checks

22 October 2026. These results describe the implementation and environment actually exercised. They do not establish household adoption, production security, or general language reliability.

Current interface/storage verification is in [READYBY_V2_VERIFICATION.md](READYBY_V2_VERIFICATION.md). Earlier UI captures and the 30-utterance model corpus are retained historical evidence; the current app entry point is `app-server.mjs`.

## Engineering results

`node scripts/evaluate.mjs` records the test run and independent scheduling evaluation in `docs/evidence/`.

- **44 automated tests passed:** 31 ReadyBy/platform tests and 13 retained legacy-prototype tests. The legacy tests are not counted as ReadyBy functionality.
- **48/48 independent tiny-instance oracle comparisons passed.** Fixed seed 20261022; two to four tasks, two people, integer minutes, release times, eligibility and prerequisites. The reference enumerates start minutes and participants independently of the planner's serial schedule generation. This is bounded evidence, not a proof for every eight-task input.
- Opening fixture: checked finish **08:19**, departure **08:20**.
- Washer update at 08:06 with 15 minutes remaining: release **08:21**, full finish **08:28**.
- Approved laundry deferral: finish **08:16**, departure remains **08:20**.
- Essential laundry: deferral is unavailable; later departure requires approval.
- Rejection retains the saved delay and infeasible current commitments.
- Progress survives browser reload and server restart; the API restart case is automated.
- Stale approvals/writes, duplicate actions, invalid prerequisites, release constraints, failed storage writes, corrupt storage, negative/ambiguous completion, paused segments and implicit final-barrier cycles are covered.

Evidence: [test output](evidence/tests.tap), [oracle report](evidence/system-evaluation.json).

## Actual AI evaluation

Runtime: local Ollama, `llama3:8b-instruct-q4_K_M`. The final declared set contains the original 20 cases plus 10 additional phrasings. Prompt tuning was informed by previous failures; this is an engineering regression set, not a blind benchmark. Earlier reports remain available.

**29/30 strict action-and-argument expectations passed.** Median recorded latency: **1,875 ms**; range **810–6,095 ms** on this machine for this run. Cold model loading was slower in earlier runs. These timings do not predict performance on another machine.

Remaining strict mismatch: **“Please check the schedule again”** returned `status` instead of `recalculate`. Status does compute a fresh schedule/description, but does not regenerate the saved recovery proposal. Use **“Recalculate the plan”** or the recovery control when a new proposal is needed. This mismatch is retained as a failure and the AI evaluation exits nonzero accordingly.

The tested pipeline includes transparent policy handling, not only raw model output. Numeric `value` aliases can be canonicalized to `minutes`; exact refusal of a pending proposal can only reject; negated/uncertain progress is blocked; a numeric change without a supplied number is blocked; and departure time strings are converted by code. Five cases in the final report recorded policy normalization. Raw intent, canonical intent and policy corrections remain inspectable. Do not advertise this as 29/30 unaided model accuracy.

Earlier findings included incorrect action/field choices, invented example values, and slower/lower-performing larger-model behavior. These motivated deterministic validation and retaining the smaller measured runtime. Failed model calls do not become successful household actions.

Evidence: [final AI report](evidence/ai-evaluation.json), earlier `ai-evaluation-*.json` files, and [actual browser mission export](evidence/live-browser-mission.json).

## Browser verification

Used the built-in CUA browser controls with Chrome. Desktop: 1440×1000 and the normal 1536×695 laptop viewport. Mobile: 390×844, with additional narrow layout inspection at 320×740. Compared the working generated concept with actual captures; the concept's incorrect task labels/times were intentionally replaced by engine data. At the normal laptop size the primary recovery action ended at y=424, within the first viewport. At 320px it ended at y=392; document scroll width equalled client width (305px after scrollbar). Keyboard Tab moved from recovery approval to the later-departure review control.

Exercised: real AI mission start, real AI washer update, real AI revision approval, browser reload, judge scenario controls and varied constraints, essential-task conflict, deferred-work readiness form and resumption. Actual saved AI receipts in the exported browser mission show delay **3,682 ms** and approval **1,558 ms**. Explicit rehearsal fixtures supplied progress/time; they are labelled in the UI and do not count as AI evidence.

Repairs made: disconnected delay form; draft start action initially too far down the page; overflowing/stacked narrow departure summary; avatar/name wrapping; irregular timeline ticks; misleading suggestions when laundry was essential; vague follow-up mission title; and pause history spanning other completed work.

Screenshot capture through the full-page browser API intermittently timed out. Used the same browser's documented screenshot/clip alternatives; no alternate automation framework was needed. Microphone recognition, sound quality of browser speech playback, assistive-technology behavior and a live native Alexa device were not verified. Typed operation is the verified core path.

Evidence: `docs/evidence/screenshots/` and actual scene captures in `docs/evidence/walkthrough/`.

## Local demonstration video

`docs/evidence/readyby-local-walkthrough.mp4`: **156.14 seconds**, H.264 1440×1080 with AAC narration. Rendered from nine actual captured product states, with a separate caption band and explicit disclosure of seeded fixtures. **It is a narrated walkthrough, not a continuous screen recording.** Source scene manifest, narration script, subtitles and renderer are included. Video duration/codecs and an extracted frame were checked; a stronger continuous final recording remains an optional presentation improvement before publication.

## Release boundary

Local project, evaluation, screenshots, working concept, video and submission drafts are prepared. The owner explicitly requested keeping everything local. GitHub publishing/reviewer access, public video upload, entrant eligibility review and final Devpost submission remain pending owner direction. A native Alexa integration is not claimed. Authentication/multi-household hosting and measured customer adoption remain outside this local prototype.
