# Repository and submission-material audit

Completed 24 October 2026 IST, after the published entry deadline. This pass improves documentation and test discovery; it does not introduce product functionality, change the hosted application, move the v0.4.0 tag or replace the original release assets.

## Corrections

- Added a [judge guide](JUDGE_GUIDE.md) with the exact voice/text scenario, expected results, essential-task counterexample and fallback.
- Added a [documentation index](README.md), labelled historical evaluations and removed public links to captures retained only on the developer's machine.
- Clarified the README's customer problem and one-minute example; matched chapter names to the actual interface.
- Documented the current Gemini Live, MCP, deterministic planning, approval and persistent-storage architecture. The old PNG/SVG remains explicitly historical.
- Updated setup, contribution and security-policy scope from the earlier local 0.3 prototype to the hosted 0.4 beta.
- Restricted `pnpm test` and CI to `tests/*.test.mjs`. A broad local `node --test` discovered unrelated tests inside the ignored film workspace; that run was interrupted. The scoped ReadyBy suite passed.
- Preserved current prepared Devpost copy and updated the checklist. Actual submitted status, accepted video URL, visibility and entrant rights still require verification in Devpost.

## Observed checks

| Check | Result | Boundary |
| --- | --- | --- |
| ReadyBy tests | **64 passed**, no failures, skips or cancellations | Provider doubles where declared; no fresh human voice evaluation |
| Type checking and production build | Passed | No product code changed in this cleanup |
| Relative Markdown/HTML asset links | No missing repository targets found | External URLs and every heading anchor were not exhaustively checked |
| Supplied credential matching | No matches in checked source/material files or release ZIP | Targeted comparison against supplied keys; not a formal secret-history or security audit |
| Release ZIP file hygiene | No `.env`, database, private-key or `node_modules` paths found | Original v0.4.0 ZIP preserved |
| Release ZIP SHA-256 | `ecff27a91f134b81466a7b493a2c0ebd534d94e35b1dd8cc9f11233173aaf56e` | Matches GitHub's published asset digest |
| Public HTTPS health | Returned `ok: true`, version `0.4.0`, database `ready` | Health check only; not a fresh end-to-end voice or availability test |

Public repository metadata already included the description, live homepage, topics, MIT license, issue templates, contribution policy, changelog and versioned releases. The original v0.4.0 implementation commit remains **d6adb474cf35376ecbfc011b7f6bbbe9369ddeea**.

The repository explains and reproduces the implemented system. It does not establish customer adoption, commercial ROI, production-scale readiness or a judging outcome. Documentation cannot replace a clear required demonstration video.
