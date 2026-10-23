# ReadyBy: PM release review and improvement brief

22 October 2026. Decision: **do not present v0.1 as a market-launched product or our strongest finished entry. Improve it before the final capture.**

The idea can compete on checked household deadline recovery. Current local implementation establishes engineering feasibility. It does not establish customer retention, launch readiness, or a likely shortlist outcome. Registrations are not completed competing submissions, and we have no defensible shortlist probability.

## Assessment against the actual criteria

The [official rules](https://amazonappdev2026.devpost.com/rules) weight Tech Implementation, Design, Potential Impact and Quality of the Idea equally. The permitted Alexa+ simulation path remains our delivery path; native integration is not claimed.

| Criterion | v0.1 assessment | Product action |
|---|---|---|
| Tech implementation | Stronger than the UI: checked planner, recovery, saved state. Single global JSON mission and no household isolation limit credibility beyond the fixture. | Add authenticated workspaces, transactional mission persistence, role checks and operational tests. |
| Design | Legible but generic; large amount of explanatory/debug text; fixed sample names and tasks; no first-use or return-use journey. | Design a cohesive household product, goal-first workspace, focused recovery comparison and real setup/routine flows. |
| Potential impact | Recurring job is plausible. No direct household outcome evidence. | Enable real names, custom tasks, reusable routines and multiple missions. Keep impact claims hypothetical until observed. |
| Quality of idea | Meaningful recovery mechanism; routine management itself is crowded. | Show one changed constraint causing a checked trade-off, rejection, impossible essentials and durable recovery on a user-created mission. |

## Why it currently feels like a prototype

- `readyby-server.mjs` opens one global store before handling requests. There is no identity/household authorization boundary.
- `src/readyby/store.mjs` atomically saves JSON but provides neither multiple-mission querying nor transactional account/session storage.
- `readyby/public/index.html` begins with a prepared mission, has no household setup, and exposes Judge view in the primary navigation.
- `readyby/public/app.js` combines rendering, interaction state, timeline drawing, transport and dialogs in one module. Repeated CSS overrides increase redesign risk.
- The narrated video uses captured states. It is honest, but a continuous core interaction would be more persuasive.

These are concrete gaps, not an argument that every hackathon needs enterprise infrastructure. A beautiful app without reliable recovery would still miss the central product value.

## This implementation pass

Primary audience remains two adults coordinating a departure. Deliver a coherent private-beta candidate locally:

1. Purposeful product shell: Today, Routines, Household and Settings; customer language and a separate system review surface.
2. First-use flow: a private demo without signup, or create a household with real participant names and a mission template.
3. Real usage: custom tasks and deadlines, editable assumptions, named owners, saved routines, multiple saved missions and explicit mission switching.
4. Identity and data: password-hashed accounts, server-side sessions, CSRF checks, roles, expiring household invitations, independent household data and SQLite transactions.
5. Recovery: keep the existing planner/checker boundary; surface plan changes prominently, preserve completed facts, and never confuse preview with commitment.
6. Reliability: request limits, rate limits, bounded AI concurrency, recoverable errors, export, local backup procedure and launch configuration checks.
7. Evidence: refreshed browser checks, authorization/integrity tests, visual comparison, current limitation ledger and a stronger demo path.

No publishing or external accounts are required to do this local work. Cloud monitoring, native Alexa onboarding, billing and commerce do not improve the core job at this stage and are not being invented for the submission.

## Design direction

One distinctive visual: a household's parallel work converging on a fixed departure line. A quiet midnight navigation rail, open pale-blue workspace, a strong white mission canvas, humanist type, person-specific next actions and one legible recovery decision. Avoid both a generic analytics dashboard and a smart-display imitation that claims native Alexa access.

Keep voice/text input available across the primary workflow. Show short outcomes in the household view; calculations and raw tool traces belong in the separate review view. The user should see what to do and what changed, not implementation jargon.

## Gate before saying “market launch ready”

A local authenticated private-beta build is still not an externally operated launch. Public release requires a tested HTTPS deployment, runtime capacity on its real hardware, backup/restore and incident ownership, privacy/retention review, account recovery verification, accessibility validation, and at least observed use by target households. We will record which gates are implemented, locally verified, or still unverified. We will not manufacture customer metrics or claim an external security audit occurred because a skill was installed.

Submission recommendation after this pass: submit the strongest verified version rather than miss the deadline chasing broad features. Shortlisting remains a comparative judgment we cannot guarantee. The video must lead with the changed household outcome and show the system actually doing the work.

## Decision after the 0.2 implementation

The initial UI and account/storage gaps have been materially addressed and locally verified. The current entry has a stronger chance to communicate its value, but we cannot infer shortlist probability from registration count. Submit the upgraded product with its checked recovery and protected-essential counterexample. Do not use account features as the main differentiator or present a new visual design as customer demand validation.

Current evidence is in READYBY_V2_VERIFICATION.md. Public operation and observed customer outcomes remain open. The simulated eight-minute conflict and four-minute planned buffer are calculation evidence, not measured customer time savings or revenue. For Amazon, improved repeat household use and trust are plausible business benefits; neither has been established in this project.
