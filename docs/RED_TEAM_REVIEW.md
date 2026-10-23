# KinRelay prize-readiness review

Research reviewed October 21, 2026. Status: HOLD; do not treat the prototype as a finalized competition concept. No new product code was changed during this review.

## Finding
Customer pain and a commercial care-coordination category are established. Demand for KinRelay, a meaningful competitive advantage, and a strong agentic implementation are not established. Previous selection gave insufficient weight to those gaps. Existing prototype work is not a reason to continue investing.

## Primary-source evidence
- Caring Village app: shared task owners, calendars, family views and paid plans. https://caringvillage.com/app/
- Caring Village guide explicitly covers changed visit times, confirmation of coverage, named responsibility, acknowledgements and backup contacts. This is evidence of workflow overlap, not proof its app automatically replans. https://caringvillage.com/blog/care-coordination/caregiver-communication/
- Ohai April 17, 2026 release: household tasks, assignment, reminders, unified calendars, conflicts, voice. https://www.ohai.ai/blog/meet-the-new-ohai/
- Wellthy: human-led coordination, care circle, messaging, task management and backup care. Its service economics cannot be borrowed to justify pricing for our narrower app. https://wellthy.com/for-employers
- Amazon documents calendar management, contextual preferences, document recall, event extraction and cross-session continuity in Alexa+. These are platform baselines, not KinRelay differentiation. https://www.aboutamazon.com/news/devices/new-alexa-top-features
- Alexa Together is no longer available per Amazon. This is neither evidence of an empty market nor evidence of why it ended. https://www.aboutamazon.com/news/devices/alexa-together-launches-to-help-customers-remotely-care-for-loved-ones
- Official rubric: implementation, design, potential impact and idea quality equally weighted; simulated Alexa+ path allowed using AI/agentic tools. https://amazonappdev2026.devpost.com/rules

## Prototype audit
src/engine.mjs uses explicit command regular expressions, supplied availability and one mutable appointment task. It has meaningful acceptance and revision protections, but is not a natural-language agent. Tool activity labels describe local functions, not evidence of independent external service orchestration. Participant switching is not authentication; no real notification, real calendar or Alexa integration exists. Pending to accepted transitions are correct engineering practices, not a demonstrated competitive moat.

## Rubric judgment (qualitative, not predicted scores)
- Implementation: insufficient agentic substance today; narrow deterministic workflow is groundwork.
- Design: coherent visual interaction, but voice, interruption and clarification are untested.
- Impact: clear underlying problem; onboarding, adoption, time savings and buyer unvalidated.
- Idea quality: generic shared task coordination overlaps incumbents; recovery needs a sharper demonstrated advantage.

## Conditional continuation, not a new winning claim
Only pursue an autonomous care-logistics recovery experiment if it can repair a previously unseen multi-task disruption while respecting supplied time windows, capabilities, travel buffers and consent. Compare two feasible alternatives or report no solution. Obtain real acceptance through independent local participant sessions. Recover from a late/stale response and survive restart. Use actual agent tool calls, with deterministic validation of every state change.

## Go/no-go evidence
1. Runtime: a real local language/agent runtime runs on the available machine without paid API calls; otherwise the zero-external-runtime requirement and flexible conversational promise are unresolved.
2. Generalization: multiple unannounced inputs and disruptions work without editing command patterns or scenario code.
3. Comparative usefulness: a few target users attempt the same task with their current process and the prototype; observe time, coordination actions, errors, and stated reuse. This is directional validation, not a study or efficacy claim. No users were contacted in this session.
4. Demo: under three minutes shows disruption, actual tool-driven recovery, participant decline/rejection, a changed feasible plan, and persisted acceptance.
5. Competitive explanation: demonstrate the improvement over a shared calendar/task list; do not claim incumbent absence without testing.

Failure of runtime or workflow generalization is a no-go for pitching this as an autonomous Alexa+ coordinator. Failure of demand validation means present customer benefit as a hypothesis, not proven traction. Preserve the prototype for reuse, but do not add cosmetic features to compensate.
