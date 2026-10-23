> Historical 22 October design audit. Current hosted interface and voice evidence: [0.4 verification](READYBY_0_4_VERIFICATION.md). Audit screenshots named below remain local work products.

# ReadyBy — Product Design audit and fixes

22 October 2026. Scope: choose a recovery, approve it and understand the saved result. Captured in the in-app browser during this audit, then repaired and recaptured. Existing user progress was preserved; a separate demo mission was used. No external publication.

## Verdict

The recovery flow communicates a credible decision. This audit corrected misleading finish wording, buried saved-work context, mismatched visual/DOM order and a keyboard focus issue. The visual design and scheduling/approval system were preserved. The result is a stronger local private beta, not proof of market launch readiness or prize likelihood.

## User goal and accessibility target

Keep the departure where feasible, understand the trade-off, deliberately approve it and know what remains undone. Target clear reading/focus order, named dialogs, keyboard operation and usable phone reflow. A complete WCAG or screen-reader audit is not claimed.

| Step | General health after fixes | Verified behavior |
|---|---|---|
| 1. Compare recovery choices | Good within tested scope | Eight-minute conflict and two alternatives visible; both actions explicitly lead to review; reading order matches visual order. |
| 2. Review and approve | Improved; keyboard retest passed | Named dialog explains deadline, deferral and finish. Tab cycles Close → Approve → Go back → Close; reverse wrapping passes. Enter activates approval. |
| 3. Understand the saved result | Improved; phone check passed | 08:20 retained, planned finish 08:16, two completion reports preserved, laundry explicitly identified as unfinished saved work beside the deadline. |

## Strengths

Deadline and consequence are easy to locate. Observed progress remains distinct from estimated finish. The approval boundary is explicit, and saved work remains available for a later readiness check. No simulated appliance completion or native Echo integration is claimed.

## Findings and repairs

- **P1, Step 3 — Misleading scope:** “Planned full finish” could imply all original work was included after a deferral. Replaced with “Planned finish.”
- **P1, Step 3 — Missing immediate context:** laundry deferral was only explained far down the screen. Added a persistent notice beside the deadline that names saved work and states that it remains unfinished.
- **P1, Steps 1/3 — Reading order:** CSS had moved the timeline disclosure and composer without matching DOM order. Reordered the actual markup to follow the visible sequence.
- **P1, Step 2 — Keyboard and naming:** the tested last Tab reached BODY. The dialog had no accessible name. Added explicit forward/reverse focus wrapping and connected the name to its heading; retested in the real browser.
- **P2, Step 1 — Action expectations:** “Keep departure” opened a second review whereas the alternative already said Review. Renamed to “Review this plan.”
- **P2, Step 1 — Voice affordance:** a microphone icon only opened availability information. Replaced it with an information icon. The control continues to explain the simulation; no microphone capture was added.

## Captured steps after repair

### 1. Compare recovery choices

Recovery choices after the audit — local historical file: `docs/evidence/product-design-audit/01-recovery-after.png`.

### 2. Review and approve

Named approval dialog with visible keyboard focus — local historical file: `docs/evidence/product-design-audit/02-approval-after.png`.

### 3. Understand what was saved

Saved result with explicit unfinished-work context — local historical file: `docs/evidence/product-design-audit/03-saved-after.png`.

Phone verification of Step 3:

Saved result at 390 pixels wide — local historical file: `docs/evidence/product-design-audit/03-saved-mobile.png`.

## Evidence and limits

Before captures are 01-recovery-before.png, 02-approval-before.png and 03-saved-before.png in the same folder. Saved image bytes were inspected; before and after saved-result captures were compared together at the same viewport width and equivalent mission state. Numbered notes are in notes.md.

The pre-fix washer update used actual local AI. Its receipt showed **24,419 ms**, an additional observed latency rather than a benchmark. Post-fix recapture used the explicitly labeled direct delay control to reproduce the same constraints; it is not counted as another AI test. No new model accuracy claim is made.

Strict TypeScript checks and Vite production build passed after the repairs. Only frontend code changed. Existing 44-test domain/platform verification and 48-case oracle results remain the earlier backend evidence; they are not represented as new tests of visual accessibility.

At 390 × 844 there was no horizontal page overflow, and the saved-work notice fit with the main deadline/result. Timeline scrolling is contained in its own region. Temporary viewport override was reset.

Remaining risks: small secondary labels and complete contrast/zoom testing; full assistive-technology coverage; expired-proposal recovery under actual live time; model latency and deployed capacity. Screenshots cannot establish real customer impact, retention, production security or operational readiness.

## Recommendation

Use the repaired recovery and saved-result screens in the final demonstration. Retain the candid local-private-beta designation. The next most material product concern is conversational latency, not adding more visual decoration.
