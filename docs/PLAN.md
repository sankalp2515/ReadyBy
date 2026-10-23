# KinRelay Implementation Plan

**Goal:** Prove a transparent appointment-change-to-accepted-handoff workflow in a local Alexa+ simulation.

**Architecture:** Pure state engine and command router; local JSON store behind HTTP; browser views share authoritative state. Prototype personas and deterministic language handling are prominently disclosed.

**Spec:** docs/DECISION.md

## Tasks
- [ ] 1. Write engine tests and observe failure; implement supplied-calendar feasibility, actor permissions, revision checks, offer invalidation, and derived coverage.
- [ ] 2. Build loopback-only server with atomic persistence, serialized mutations, same-origin protection and strict request limits. Test persistence and API errors.
- [ ] 3. Build responsive household workspace, assistant command input, participant inbox, actual event history and transparent tool activity.
- [ ] 4. Verify full happy path and decline path, reload, keyboard interaction, and mobile layout in browser. Save evidence and document limitations.

## Review focus
- Acceptance must never resolve a stale or revised appointment.
- Two simultaneous writes must never both apply to the same revision.
- Coordinator cannot accept for another participant.
- Unknown names/times/commands must not silently mutate state.
- Empty candidate sets and declined offers must remain uncovered.

## Execution ruling
Proceed inline under the user's explicit instruction to select an idea and start a prototype. No deployment, external messaging, account connection, or live Alexa claim. Workspace was empty and not an existing checkout; no worktree or commit is required for the prototype.
