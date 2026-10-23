# KinRelay: Alexa+ prototype decision

> Status after deeper competitor and code review: HOLD. See RED_TEAM_REVIEW.md. Prototype selection is not a finalized recommendation for a prize submission.

## Decision
Build a local Alexa+ experience simulation for recovering family-care logistics when plans change. User explicitly authorized autonomous selection and prototype construction on October 21, 2026. This is a prototype, not a production integration or an emergency/medical service.

## Customer and job
A working adult coordinating a relative's rides, meals, and visits needs to know whether the next day's plan is actually covered. An assignment is not an accepted commitment. When an appointment moves, identify the affected assignment, compare supplied availability, ask before offering a replacement, and require that replacement's acceptance before claiming coverage.

## Evidence, checked October 21, 2026
- AARP/NAC report 63 million US family caregivers and substantial work/financial strain: https://www.aarp.org/press/releases/2025-07-24-new-report-reveals-crisis-point-for-americas-63-million-family-caregivers.html
- Caring Village already sells named task ownership, calendar and communication features. Paid plans show a commercial category, not validated demand for KinRelay: https://caringvillage.com/app/
- Caring Village also discusses affirmative acceptance and changed visits. Do not claim this workflow is unique: https://caringvillage.com/blog/care-coordination/caregiver-communication/
- Amazon previously offered Alexa Together; Amazon says it is no longer available. This supports past interest, not an inference about why it ended or present unmet demand: https://www.aboutamazon.com/news/devices/alexa-together-launches-to-help-customers-remotely-care-for-loved-ones
- Rules allow a simulated Alexa+ web experience using AI/agentic tools. A deterministic prototype is useful to assess workflow, but is not evidence of a live Alexa+ integration or sufficient final agentic implementation: https://amazonappdev2026.devpost.com/rules

## Alternatives and judgment
Judgment is qualitative, not predicted judge scores or win probabilities.

| Idea | Implementation | Design/platform fit | Impact | Idea differentiation | Delivery risk |
|---|---|---|---|---|---|
| KinRelay | Stateful, multi-person recovery can be demonstrated | Voice summary + actionable cards suit a household | Specific recurring coordination problem; commercial category | Existing competitors; focus on explained recovery and acceptance | Moderate; local workflow feasible, deployment later |
| KitchenConductor | Constraint scheduling is substantial | Hands-busy voice fit | Broad repeat use | SideChef explicitly markets multi-recipe timing | Higher: recipe quality and flexible dialogue |
| HouseOps | Simulated booking lacks real service completion | Strong voice fit | Clear household utility | Alexa+ already markets service booking | High external-provider dependence |
| RoutineGuard | Local model checking possible | Technical setup poorly suited to ordinary voice users | Plausible troubleshooting value | Existing testing tools and research | High gap to existing Alexa routine access |
| WarrantyDesk | Evidence packet feasible | Document upload and review dominate voice | Useful but occasional | Crowded inventory/document category | Moderate; extraction burden |

## Winning hypothesis
The demo shows a plan becoming uncovered, the exact conflict, a feasible candidate, an offer that does NOT falsely imply coverage, acceptance by the participant, and a persisted confirmed plan. Demonstrable implementation, device-appropriate action cards, specific impact, and a coherent failure-recovery story support the four equally weighted criteria. No claim of novelty or guaranteed prize.

## Business hypothesis and limits
Family subscription or care-provider seat pricing could fund a deployed product. Measure coordination time, acceptance latency, unresolved tasks, and repeat use in a future pilot; do not claim medical benefit, prevented harm, revenue, or ROI before evidence. Distributed access, actual identity, consent, secure hosting and delivery acknowledgements remain production work. No messages are sent externally by this prototype.

## Prototype contract
- Node 22 built-in HTTP/filesystem, browser HTML/CSS/ES modules; zero npm or runtime network dependencies.
- Scenario date fixed at October 22, 2026, explicitly labelled. All people and events fictional.
- Four selectable demo personas; switches simulate identity and are NOT authentication.
- Structured local commands, not an LLM. Unsupported input explains supported actions. No pretend speech recognition, Alexa connection, external calendar access or notifications.
- Real planner considers the entire supplied availability interval, existing accepted tasks, declined candidates, and active proposals.
- Appointment changes invalidate pending offers. Coverage remains at risk until a new participant accepts.
- Optimistic revision checks prevent stale acceptance. Mutation requests are serialized and state is persisted by atomic file replacement.
- Readiness is derived from actual task states, not a cosmetic score.
- UI: slate-blue sidebar, white working canvas, cobalt action, amber uncovered state, teal confirmed state. System Segoe UI and Georgia for a friendly household identity. Main focal element is the visible handoff, not a grid of metrics.

## Acceptance criteria
Reschedule ride from 15:00 to 14:00; show Arun's availability conflict; suggest Priya rather than unavailable Dev; coordinator offers; Priya accepts in her view; coverage updates only then. Reject wrong-person, stale, duplicate, overlapping, and unsupported mutations. Reload retains state. Alternative decline/no-candidate path remains visibly uncovered. Reset requires an explicit UI confirmation.
