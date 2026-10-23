# Changelog

## [0.4.0] — 2026-10-23

- Product landing page with three computed recovery examples, no-signup entry, privacy/scope disclosures and responsive layouts.
- Guided demo chapters and a conversation-first household display.
- Gemini Live streaming audio, barge-in playback interruption, captions, Stop controls and three-minute sessions. Only actual heard transcripts reach the MCP bridge; model arguments cannot directly change a mission.
- Single-use, configuration-locked ephemeral credentials; permanent provider keys remain server-side. Production voice/text allowances persist across restarts.
- Clear short consent replies navigate to exact proposal review without model inference or commitment changes.
- Public HTTPS judge beta on a dedicated Google Cloud project, supervised Node process, persistent SQLite and checked daily backups.
- Provider response-body failures now permit fallback, and domain errors retain actionable messages through MCP.

The owner confirmed a successful browser/microphone voice smoke test; noisy-room quality and large-traffic capacity remain unmeasured. Live voice is an Alexa+ web simulation, not native Echo connectivity. Current test and hosted integration evidence: [0.4 verification](docs/READYBY_0_4_VERIFICATION.md).

## [0.3.0] — 2026-10-23

### Added

- Official-SDK MCP server and browser/CLI clients: protocol 2025-11-25, Streamable HTTP and 13 household tools.
- Shared mission service with scoped, expiring prepared calls and revision/idempotency checks.
- Exact-proposal, single-use confirmation. Natural-language approval opens review instead of applying a consequential change.
- Groq, Gemini and NVIDIA inference adapters, local Ollama mode, explicit provider receipts and quota-aware fallback.
- Actual MCP inspection in system review and retained initialization/discovery traces.
- Independent-client traces, provider evaluation reports, current architecture, browser evidence and a labelled narrated walkthrough.
- Public documentation, contribution/security guidance and CI for source tests, TypeScript and build.

### Verified

- 56 passing automated tests in an isolated source export; typecheck/build passed.
- Selected hosted pipeline: 30/30 declared development utterances, median 1,047 ms and p95 3,821 ms. Prompt-informed corpus; failures from earlier runs retained.
- Actual browser recovery, explicit review, essential-task protection, reload/restart and desktop/phone layouts.

### Scope

Local Alexa+ simulator, not native Echo connectivity or a production cloud deployment. Human microphone quality, load capacity and customer demand remain unmeasured. Release source and evidence contain no provider keys or live household databases.

## 0.2 — local development milestone

Household display, film-inspired interface, private household persistence, routines, local speech input/transcript review and real local-model interpretation. Historical reports are retained; they do not describe the final 0.3 consent/MCP path. No prior public release is implied.

## 0.1 — local development milestone

Deterministic household scheduling prototype, independent checker, explicit progress, deadline recovery and initial model-intent evaluation. No prior public release is implied.

[0.3.0]: https://github.com/sankalp2515/ReadyBy/releases/tag/v0.3.0

[0.4.0]: https://github.com/sankalp2515/ReadyBy/releases/tag/v0.4.0
