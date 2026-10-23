# Film integration — implementation and evidence

23 October 2026, local Windows build. This record supersedes the earlier UI-only audit for the new household display; historical engine, oracle and model-corpus results retain their original scope.

## Delivered

- Film-inspired ivory/charcoal/amber/green visual system and a responsive household display, connected to actual missions. Full workspace remains available for setup; system review retains receipts and technical details.
- Deadline, checked finish, next actions by person, task progress, recovery proposal, explicit review/approval, deferred-work notice, schedule and persisted history.
- Optional local microphone capture through an AudioWorklet, bounded to 20 seconds, with editable transcript review before sending. Local recorded-clip recognition provides a reproducible alternative. Raw audio is processed in memory, not saved by the application.
- Vosk 0.3.45 local speech worker; pinned setup dependencies and checksum-verified English model. Installed local English browser voices can speak replies; sound starts off. This is push-to-talk and transcript review, not a wake-word assistant or native Alexa speech.
- Bounded washer clarification: five-minute wall-clock limit, same mission minute and revision, unique matching pending wait task. A scalar duration cannot select a task after scope expires or changes. These receipts are distinct from actual AI requests.
- Existing household authorization, CSRF, revision checks, idempotency, scheduling and independent checker remain authoritative. Speech endpoints require authentication; transcription requires CSRF and enforces audio bounds/rate limits.

## Actual checks

**Automated:** 48/48 tests pass, including four new conversation/platform cases and additional missing-duration guard coverage within an existing test. 35 tests concern ReadyBy/platform/conversation; 13 are retained legacy tests. Strict typecheck and production build pass. Final assets approximately 94.62 kB gzip JavaScript and 12.36 kB gzip CSS. See `evidence/film-integration/tests.tap`.

The historical independent oracle remains 48/48 small cases, and the historical 30-utterance model corpus remains 29/30. Neither was rerun or relabelled as new voice evidence.

**Actual browser flow:** a separate mission was created for this integration, leaving prior missions available. The labelled delay chapter seeded 08:06 and two reported completions. A real request, “The washer needs more time,” invoked the configured Ollama model. Its raw output invented a 12-minute delay. The numeric grounding guard blocked that value; no task or schedule changed. The application asked how many minutes remained. Model latency was **20,426 ms**. This is a successful application boundary, not unaided model correctness.

A Microsoft Zira Desktop synthetic “Fifteen minutes” WAV was selected through the browser's recorded-speech control. The local recognizer produced an editable **“fifteen minutes”** transcript. Sending it resolved the current question without another AI invocation and called the real delay action: full finish **08:28**, proposed retained-work finish **08:16**, deadline **08:20**, two completions preserved, laundry still pending. Review change opened the existing approval dialog; Shift+Tab from its close control wrapped to Go back. Enter on Go back dismissed the review without applying the proposal.

A separate actual model request, “Yes, save the laundry for later,” returned `approve` with `optionKind: defer` in **18,878 ms**. It committed the matching pending proposal, leaving laundry deferred and unfinished. The approved mission and reported progress survived both browser reload and an actual server process restart. Actual raw/corrected receipts are saved in `evidence/film-integration/actual-browser-receipts.json`.

**Protected-essential case:** a separate demo mission seeded the essential-laundry chapter. A labelled direct delay control supplied 15 minutes; this check is not claimed as another AI test. The household display offered **08:28 departure**, retained the current **08:20** deadline pending agreement, and offered no deferral. Schedule showed laundry 08:21–08:26 and the final check 08:26–08:28. History retained the essential-flag change and the reported delay.

**Speech service:** after server restart, a synthetic fixture was recognized correctly in **861 ms** through the authenticated endpoint. The browser file flow separately verified client decoding/resampling, upload, transcript and real command submission. See `evidence/film-integration/speech-service.json` and the clearly labelled synthetic WAV/PCM fixtures.

**Browser and layout:** checked the normal in-app viewport, the reference's 1920×1080 desktop size, and 390×844 / 360×800 phone sizes. Phone page content did not exceed document width: 375/375 and 345/345 CSS pixels respectively after the browser scrollbar. Phone visual and DOM order place the decision before conversation and detailed tasks. Schedule and history tabs were exercised. Local voice availability appeared; the spoken-replies switch was tested on/off, ending off. Microphone permission was not granted or human audio captured by this verification. Actual listening quality, speech with the owner's accent, a full screen-reader audit and broad browser/device coverage remain unverified.

Temporary viewport overrides were reset. The approved recovery mission is selected in the retained product tab.

## Visual comparison ledger

| Reference | Implementation / evidence | Difference or repair |
| --- | --- | --- |
| Ivory #f4f2ed, charcoal #292b28, amber #a16820, green #52725c | `frontend/src/film.css`, `integrated-household-desktop.png` | Exact palette, existing system typography retained to avoid an external font dependency. |
| Deadline and task hierarchy, 00:32 | Enlarged deadline, task rows, computed finish and next actions | Retained the actual seven-task/two-adult scenario; film uses a different five-entry 08:00 story. |
| Clear proposal/approval, 01:28–01:46 | `recovery-mobile.png`, `approval-desktop.png`, actual consent receipt | Exact consequences shown before approval; proposal and saved state remain distinct. Quoted task titles avoid “save hang laundry” phrasing. |
| Completed and deferred work, 01:55–02:15 | `integrated-household-desktop.png`, `saved-default.png` | Persistent completion facts and explicit unfinished saved-work labels. No observed departure claim. |
| Timeline | `essential-schedule.png` | Uses actual per-person lanes and passive release estimates; film's authored bars are not copied as schedule data. |
| Desktop shell and operational metadata | Full workspace/system review plus household display | Administrative sidebar omitted from household view. Database revision belongs in inspection; no invented plan-version lifecycle is shown. |
| Mobile | `essential-mobile.png`, `essential-mobile-360.png` | Repaired hidden brand, shortened supporting copy, kept review action visible at 390px, fixed logical reading order. |
| Conversation adaptation | `integrated-conversation.png` | Functional local speech/transcript controls replace animated typing. Spoken reply switch starts off and never represents native Alexa connection. |

Core copy checked against inventory: “Alexa+ experience simulation,” “Local AI · No device connection,” “Leave by,” Tasks/Schedule/History, “Review change,” “Review estimates,” “Record request,” and “Send request.” Extra simulation/seed labels are necessary to explain the actual evidence. State revisions and developer receipts remain in system review. Full workspace voice information was updated to point to the new household speech path.

Some evidence captures precede minor final copy and keyboard-order repairs; `integrated-household-desktop.png` and final phone captures are the current visual references. No pixel-identical clone, full accessibility certification, universal speech recognition or production latency is claimed.

## What is still open

AI latency remains unsuitable for an unqualified market-launch claim. The two measured requests are observations, not a latency benchmark. Rehearse actual human speech and the final uninterrupted recovery segment before recording. Verify a fresh checkout on the judge setup. Final public video, GitHub/reviewer access, owner eligibility/rights review and submission remain pending. No cloud integration, native device connection, mini-challenge entry or public publication was performed. See `READYBY_HACKATHON_READINESS.md` for decisions and deadlines.
