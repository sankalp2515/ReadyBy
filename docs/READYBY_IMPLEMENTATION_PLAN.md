# ReadyBy: product decision and implementation plan

Decision date: 22 October 2026. Status: implementation specification, not a report of completed features or passing tests.

## 1. PM decision

**Build ReadyBy for Alexa+, centered on departure recovery.** Position it as: **“Help us leave on time, even when the plan changes.”**

The attachment has the right architectural judgment: conversational interpretation must be separated from executable planning, observed progress, and consequential approvals. Its scope is too broad for the remaining submission window. Build one excellent morning departure with two adults, seven tasks, one disruption, one approval, and recovery after a restart.

The winning moment is not generating a schedule. It is hearing “the washer still has fifteen minutes left,” proving why the original plan fails, preserving work already done, and offering a precise revision that protects departure. This makes an otherwise familiar category demonstrably agentic.

I would fund this prototype and lock the scope. I would not yet approve a large product investment: direct demand for this specific workflow, repeat use, willingness to disclose household details, and duration accuracy remain unvalidated. Prize potential is plausible; a win cannot be predicted from a concept document.

## 2. Customer and business case

Primary user: the adult coordinating a two-adult household before a school/work departure. Job: delegate the next useful actions without repeatedly rebuilding the plan mentally. Alexa fit: people are moving, carrying things, and sharing a room; brief spoken updates and a glanceable shared display fit that situation.

Evidence boundary: [Brili](https://brili.com/) markets dynamic routines and publishes testimonials about morning preparation and getting out on time. This is adjacent demand evidence selected by the vendor, not independent proof of ReadyBy demand. [Routinery's MCP guide](https://blog.routinery.app/mcp) already documents conversational routine creation, duration edits, task updates, and confirmation. Voice, persistence, and MCP alone are insufficient differentiation. We have not benchmarked either product hands-on and must not publish an unsupported “competitors cannot do this” matrix.

Our differentiation hypothesis is a shared deadline with executable dependencies, participant capacity, passive waits, and verified recovery. Show those behaviors; avoid claiming to have invented dynamic routines.

Amazon business hypothesis: successful recurring household missions could increase useful Alexa engagement and trust in multi-turn actions. Measure completed missions and repeat use, rather than conversation length. There is no defensible revenue or retention forecast yet. Subscription pricing, shopping referrals, and appliance partnerships do not belong in the hackathon pitch.

Post-hackathon validation: observe five households running the same departure twice, then measure coordinator interventions, corrections, missed essentials, perceived burden, and voluntary reuse. This is future validation, not a prerequisite experiment before building or fabricated traction.

North star: proportion of started missions completing every user-required task by the agreed deadline. Guardrails: missed required tasks, unsupported completion claims, unwanted deferrals, setup time, and intervention count. Report deadline success alongside task scope so dropping chores cannot artificially improve results.

## 3. Official judging and submission constraints

[Official rules, rechecked 22 October 2026](https://amazonappdev2026.devpost.com/rules): four equally weighted criteria are Tech Implementation, Design, Potential Impact, and Quality of the Idea. An explicitly demonstrated Alexa+ simulation using an AI/agentic tool is permitted. The native alternative is an Agent Skill or self-hosted MCP, spec 2025-11-25 or later confirmed version, over Streamable HTTP. A GitHub repository with runnable source/access instructions, public video under three minutes, and product feedback are required. Actual friction logs can receive up to 10% discretionary bonus. Submission closes 23 October at noon PDT: **24 October, 00:30 IST**. Testing access must last through judging, which ends 20 November.

Choose the **simulated Alexa+ web experience** as the delivery commitment. Make that label visible in the app, video, README, and submission. Native MCP is a stretch only after the required experience is finished; protocol work does not by itself improve customer value. Do not represent web speech or a conversational web agent as an installed Alexa feature.

## 4. What earns each score

| Criterion | Evidence we must build | Evidence in the video | Main failure to avoid |
|---|---|---|---|
| Tech Implementation | Validated AI tool calls, deterministic scheduling, persistent revisions, independent constraint checker, failure recovery | Actual delay changes computed times; restart restores progress; inspectable tool receipt | Scripted replies over hardcoded transitions |
| Design | Short dialogue, next action per person, understandable time conflict, one clear revision approval | Judge understands next action and trade-off without narration explaining the UI | Dense project-management dashboard |
| Potential Impact | One recurring customer job; transparent assumptions; credible usefulness beyond demo | A parent protects a departure without forgetting unfinished work | Unsupported savings, adoption, or revenue claims |
| Quality of Idea | Deadline recovery across people and dependencies, including an impossible outcome | Change an input and get a different, justified answer | Routine checklist with AI wording |

These are equal priorities, not an invented weighted score or a forecast of judges' ratings. If time is short, protect a working recovery loop and its clear presentation before adding features.

## 5. Locked scope

P0: two adult participants; one departure mission; at most eight tasks; durations editable; prerequisite DAG; one participant per active task; passive release time; required/deferrable flags; start, complete, pause, resume; delay and availability changes; proposed deferral/reassignment; approve/reject; persisted state; one real conversational AI adapter; typed input; accessible responsive UI; test/report artifacts; submission materials.

P1 after P0 passes: microphone with visible transcript, speech playback, second-tab participant view, one alternate mission template, validated native MCP adapter.

Cut: accounts, real identity recognition, children accepting chores, shopping, external calendar sync, smart appliance control, learned estimates, notifications outside the open app, generic routine marketplace, elaborate landing page, extra tracks. Final lock/door task means a person confirms the action; no physical lock integration is claimed.

The core has no external household services, hardware, or business APIs. Conversational AI still needs a runtime. “No external dependencies” must not conceal that requirement.

## 6. The canonical mission and correct arithmetic

Use a clearly labelled demo clock beginning at 08:00, with departure at 08:20. Real usage uses the server's current time. Both run the same planner and state transitions. Demo time can be advanced explicitly; it must never secretly accelerate recorded work.

| Task | Duration | Person in opening schedule | Prerequisite | Priority |
|---|---:|---|---|---|
| Pack school bag | 5 min | Maya | None | Required |
| Pack lunch | 4 min | Arun | None | Required |
| Fill bottles | 3 min | Arun | Lunch packed | Required |
| Clear breakfast | 6 min | Maya | None | Deferrable |
| Find shoes and put them by the door | 3 min | Maya | School bag packed | Required |
| Hang laundry | 5 min | Arun | Washer release at 08:12 | Deferrable |
| Final check and lock up | 2 min | Maya | All retained predeparture work finished | Required |

Opening schedule: Maya packs 08:00–05, clears breakfast 05–11, prepares shoes 11–14, does final check 17–19. Arun packs lunch 00–04, fills bottles 04–07, hangs laundry 12–17. All seven tasks finish at 08:19, with one minute of planned buffer. Waiting for the washer consumes no person's capacity.

Durations and priority choices are a saved, editable demo fixture. Free-form creation must identify estimates as estimates and ask the user to approve the initial draft. Do not imply the AI knows a household's chore durations.

At demo time 08:06, school bag and lunch have been confirmed complete; breakfast and bottles are active. The user reports **15 minutes remaining on the washer**. Release becomes 08:21. Laundry then needs five minutes, followed by the two-minute final check: earliest full completion is **08:28**, eight minutes after departure. This is a dependency bound independent of task assignment.

ReadyBy offers two meaningful alternatives:

- Keep 08:20 departure and defer laundry. Keep active work; shoes finish 08:14, final check finishes 08:16. Four minutes of planned buffer remain.
- Keep every chore and request departure at 08:28 or later. The deadline stays 08:20 until explicitly approved.

It does not need to offer deferring breakfast: that removes additional value without fixing the washer prerequisite. If the user says laundry is essential, the first alternative becomes invalid. The assistant must say so, rather than quietly changing the priority.

The final check is a departure barrier over the candidate's retained task set. Deferral is allowed to remove an optional task from this barrier only in the proposed revision, and only becomes committed on approval. Preserve the original task and its history in the deferred queue. Never globally delete prerequisites to make a plan appear feasible.

All times are conditional on supplied estimates. Say “four minutes of planned buffer,” not “guaranteed on time.”

## 7. Architecture and build boundaries

Use the existing Node server as a scaffold after review, not as evidence that ReadyBy exists. The workspace currently contains a KinRelay domain model and regex conversation parser. Those do not implement ReadyBy scheduling or a real conversational model. Keep old decision documents as historical records.

Data flow:

`utterance → AI structured intent/tool request → schema + policy validation → engine → independent schedule check → persisted event/revision → grounded response + UI`

Browser controls call the same domain actions as conversation. No frontend-only state changes that bypass the engine. Tool names and results shown in the evidence drawer must come from actual calls, not decorative activity labels.

Proposed modules:

| Module | Responsibility |
|---|---|
| `src/readyby/schema.mjs` | Input/task/intent schemas and invariant validation |
| `src/readyby/clock.mjs` | Server time, explicit test/demo time, timezone formatting |
| `src/readyby/planner.mjs` | Bounded scheduling search and alternative generation |
| `src/readyby/verify.mjs` | Independent feasibility checks on returned schedules |
| `src/readyby/reducer.mjs` | Legal events, execution state, versioned proposals |
| `src/readyby/store.mjs` | Atomic durable snapshot including event history |
| `src/readyby/agent.mjs` | Model adapter, bounded tool loop, grounded explanations |
| `src/readyby/fixtures.mjs` | Canonical mission and additional test scenarios |
| `public/*` | Mission display, conversation, proposed changes, evidence drawer |
| `tests/readyby-*` | Solver, state, agent, persistence, and integration tests |

Keep deployment local first. A public server would require authentication, household isolation, HTTPS, and a different origin policy; the existing loopback server is not production hosting infrastructure.

### AI runtime decision

First implementation gate: establish a working, available AI runtime in this environment. Prefer an already configured permitted provider; otherwise an installed local model with structured output. Do not assume API credits, a GPU, or a model installation. Keep credentials server-side and provide an environment example without secrets.

Implement one adapter against the selected runtime and test actual natural-language variants. Choose a runtime whose version/documentation can be verified when implementing; do not spend scarce time building a multi-provider framework. The planning engine must work without the model, but regex-only routing is an engineering fallback, not the promised AI demonstration. Recorded model output may support automated tests; it cannot masquerade as a live agent in the video.

If no usable runtime exists, report that specific blocker before claiming the complete Alexa+ simulation works. This is the only necessary AI dependency; appliance, calendar, notification, and commerce services remain unnecessary.

## 8. Scheduling specification

Model each task as nonpreemptive by default: duration, eligible participant IDs, prerequisite IDs, release time, required flag, optional priority, status, assigned participant, and recorded execution times. Paused work needs an explicit remaining-duration estimate. Completed work is fixed. Active tasks remain assigned and use remaining duration; elapsed time alone is never completion evidence.

Use integer-minute slots for the small hackathon instance. At most eight tasks, two people, and a bounded planning horizon make a deterministic branch-and-bound search practical to implement and inspect. At each state, enumerate ready task/person/start-slot choices that respect prerequisite completion, release, and availability; allow idle intervals so waiting for a higher-priority task is possible. Prune using precedence and remaining-capacity lower bounds. Use deterministic tie breaks.

For the canonical small case, finish the search and independently verify the answer. Do not call a greedy schedule “optimal.” Set a search budget for arbitrary input. Return `feasible`, `infeasible_proven`, `unknown_search_limit`, or `invalid_input`. A timeout without a solution is not proof of impossibility. If a valid solution was found but search was cut short, label optimization incomplete.

Hard constraints: no person overlap; no prerequisite violation; no task before release; required tasks retained; completed facts immutable; availability respected; no unapproved deadline change.

Candidate preference order: preserve required tasks and deadline; retain more optional value; minimize changes to existing allocations and active work; improve finish/buffer. Explain the policy rather than claiming it is universally optimal for every household.

For recovery, first check the existing remaining plan under new facts. If invalid, search retaining all tasks. Then enumerate optional-task subsets in priority order and search candidate revisions. Required descendants prevent an unsafe prerequisite deferral; preserve dependency closure. Show at most two useful alternatives. Record exactly which constraints and assumptions produced each result.

Explanation payload: affected tasks, bound or checked schedule, finish time, deadline difference, retained completions, changed assignments, deferrals, assumptions. For the washer case, cite the actual release + duration + departure barrier, not an LLM-created justification.

Resource-constrained scheduling is more than a dependency-only critical path. Label the UI “What sets the finish time” unless the displayed critical/binding chain is actually computed. Neither a green color nor a confidence score can substitute for constraint checks.

## 9. State, tool, and approval contracts

Mission fields: ID, household demo identity, timezone, absolute deadline, clock mode, revision, participants/availability, tasks, current committed plan, observed facts, pending proposal, events.

Every write carries `expectedRevision` and `idempotencyKey`. Every proposal carries ID, base revision, evaluated time, exact changes, explanation, and validity window. A delay observation is saved immediately as a fact; any proposed deferral remains uncommitted. During this interval show “current plan needs revision.” Reject approval if new events or elapsed time invalidate the proposal; recompute rather than applying a stale promise.

Suggested domain tools:

- `draft_mission(goal, deadline, participants, tasks)` → validated draft and assumptions.
- `get_mission(id)` → committed state, current observations, pending proposal.
- `record_progress(taskId, start|pause|resume|complete, remainingMinutes?)` → validated event.
- `record_disruption(releaseTime|remainingDuration|availability)` → saved fact and analysis.
- `propose_recovery(missionId)` → checked alternatives and proposal IDs.
- `approve_revision(proposalId)` / `reject_revision(proposalId)` → revision result.
- `resume_mission(id)` → preserved progress with refreshed time analysis.

User says “I packed the bag”: explicit completion report can be saved with a brief acknowledgement; do not force redundant confirmation. “Maybe Arun packed it” cannot complete anything. “We're done” needs clarification if multiple tasks remain. Deferring work, moving departure, or changing another person's commitment needs an explicit revision approval. Coordinator reassignment in this demo is a household planning choice, not proof the other person accepted or received a notification.

The AI may request domain tools; it cannot write the store, fabricate tasks completed, alter deadlines directly, or replace checker results. Validate task IDs, bounds, cycles, known participants, and user constraints. Limit the tool loop and handle provider failures with preserved state and a retry path. Use deterministic result templates for arithmetic/feasibility claims; model phrasing must not change facts.

Persist the next complete snapshot and event history atomically under a serialized write queue. Update browser state only after durable success. Fail closed on corruption; never silently replace a household with a fresh fixture. Keep demo reset explicit and separate from ordinary use.

Refresh at the current clock; persisted progress does not mean yesterday's departure is still achievable. Resuming deferred laundry later creates a new execution context with its completion history retained and asks about current readiness if the old washer estimate is stale.

## 10. Frontend specification

Design concept: a calm shared departure display. The memorable element is the two-person timeline meeting a fixed departure line. Everything else supports that action.

Palette: cloud `#F5F8FC`, ink `#132842`, blue `#1763B5`, teal `#087F78`, amber `#925800`, white `#FFFFFF`. Use local system sans typography; large readable task names; numbers aligned for time comparisons. Color always has a text/icon equivalent. No external font or image request required.

Desktop/tablet layout:

```text
ReadyBy                         Alexa+ simulation · Demo time 08:06
Leave by 08:20                  Plan needs revision

Maya: Clear breakfast           Arun: Finish filling bottles
5 min remaining                 1 min remaining

08:00        08:06          08:20 departure           08:28
Maya [done][breakfast][shoes]...................[final check]
Arun [done][bottles]...............[washer][laundry]

Laundry would push the full plan eight minutes late.
[Keep departure; defer laundry] [Review later departure]

Conversation / typed input             View why this changed
```

Render durations proportionally and distinguish planned from reported complete. Shade an approved candidate as a preview before commit. When approved, animate only changed blocks and leave completed blocks visibly anchored. If the horizon expands, keep departure visible with a clear scale change; do not distort times to fit.

Normal view: deadline, status, two next actions, concise conversation. Expand the timeline and “why” panel on disruption; the diagram is supporting evidence, not a required planning skill for the user. Mobile stacks participant next actions, recovery proposal, and conversation; timeline may scroll with a visible departure marker.

Required states: empty/start, draft assumptions, active/on track, blocked task, newly infeasible, proposal awaiting approval, rejected proposal, revised/on track, required work impossible, restored session, provider unavailable, save failed. Never show “on track” while a rejected/stale plan remains infeasible.

Typed input is always available. If microphone works, show transcript and listening state; do not imply Alexa wake-word support. Demo participant switching is labelled as a simulation, not authentication or voice recognition. Evidence drawer contains actual revision IDs, calculation, constraints checked, and tool results. Technical details stay outside the primary household flow.

## 11. Build sequence and time allocation

Use elapsed engineering hours, not calendar assumptions. Reserve the final four available hours for recording and submission. If less time remains than estimated, cut P1 immediately; do not consume the recording reserve.

| Sequence | Budget | Deliverable / exit condition |
|---|---:|---|
| A. Runtime and contracts | 1 h | One actual AI call works; validated intent; chosen delivery path recorded |
| B. Engine vertical slice | 4 h | Canonical plan, delay, both alternatives, invariant checker, impossible-required case pass |
| C. Persistence and agent | 3 h | Spoken-style text drives real tools; approve/reject, restart, stale approval, provider error work |
| D. Product interface | 4 h | Complete core flow, timeline, clear proposals, responsive and keyboard review |
| E. Evidence and hardening | 2 h | Integration/evaluation report; varied inputs; clean-start rehearsal |
| F. Submission | 4 h reserved | Under-three-minute capture, repository/run guide/license, feedback, actual friction log, final form |

These are estimates for a narrow build, not a guarantee. Build B with a simple working interface before D polish. Stop any optional feature that jeopardizes the complete demonstration.

## 12. Verification and evidence

Independent checker: every retained task occurs once; durations respected; no overlap; prerequisites and release times respected; required tasks retained; deadline status truthful. Compare the planner against a separate exhaustive reference on very small generated cases. Use fixed random seeds so failures reproduce.

Minimum meaningful scenarios:

1. Canonical opening schedule finishes at 08:19.
2. Washer delay yields the 08:28 lower bound and approved 08:16 revision.
3. Same delay with laundry required cannot propose deferral.
4. Different washer wait produces a different calculated answer.
5. Participant unavailable: never double-book remaining person.
6. Required prerequisite cannot be removed through optional deferral.
7. Completed work survives replan, refresh, and server restart.
8. Active task and paused remaining effort are preserved correctly.
9. Duplicate completion is idempotent; stale revision/approval rejected.
10. Proposal rejection preserves observed delay and infeasible status.
11. Ambiguous or negated completion does not complete a task.
12. Invalid duration, cycle, unknown person, expired deadline, and search limit produce honest outcomes.
13. AI provider or disk write failure never creates a fake success.
14. Resume deferred work later keeps history and revalidates stale assumptions.

Conversation evaluation: 20 predeclared utterances covering paraphrases, ambiguity, negatives, delays, and approval. Report exact supported outcomes and failures after execution, with runtime/model identity. Do not quote a reliability percentage before this runs. Measure actual end-to-end latency; aim for responsive acknowledgement and a checked result within a few seconds, with visible progress for slower calls.

Create `docs/READYBY_EVALUATION.md` from results, not aspirations. Include reproducible commands, fixture data, planner limitations, and screenshots. A list-only baseline can illustrate missing schedule validation on the same fixture, but is not a measured competitor benchmark.

## 13. Demonstration and submission assets

Follow `READYBY_DEMO_SCRIPT.md`. First record one continuous functioning core interaction. Narration and trimmed waits can improve pacing, but label clock jumps and do not splice simulated outcomes into a live sequence. Keep a separate capture of an alternate input and the impossible-required case for the repository.

Repository must explain actual AI runtime setup, environment variables, source entry points, local launch, tests, demo clock/reset, assumptions, integration status, and known limitations. Judges need a no-business-account path to exercise engine/UI; full AI reproduction also needs a documented accessible runtime. A deterministic test replay must be labelled replay, never live AI. If an already available hosted experience is used, confirm judge access for the required period; do not assume a localhost link is accessible.

Use only genuine developer feedback/friction encountered during implementation. Include factual steps, expected/actual behavior, workaround, and an actionable improvement. Do not fabricate Alexa SDK usage, native integration, Kiro use, customers, savings, or test results to target bonus points.

## 14. Final release gate

ReadyBy is ready to submit when a fresh start can create a mission with real AI, calculate a checked plan, record actual reported progress, detect a changed deadline conflict, request approval for a valid revision, preserve progress through restart, and show a clear impossible outcome when essentials cannot fit. The under-three-minute video must make those capabilities legible without relying on the narrator's assertions.

Lock the idea now. Build and prove that loop before extending the roadmap.
