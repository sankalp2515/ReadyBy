# ReadyBy 0.3 source export verification

23 October 2026. A selected source export was copied to a fresh OS temporary directory outside the development workspace using `python -X utf8 scripts/package-submission.py --check-dir`. No `.env`, household database, accounts, sessions, installed dependencies, Python environment or model weights were copied.

| Check | Actual result |
| --- | --- |
| Frozen dependency install | Passed; 118 packages, pnpm 11.25.0. |
| TypeScript checking | Passed. |
| Production build | Passed; Vite 8.3.5; main JS 318.70 kB / 96.86 kB gzip. Official MCP SDK is split into separate chunks. |
| Automated tests | **56 passed**, zero failures, skips or cancellations. Full TAP is in `evidence/mcp-integration/tests.tap`. |
| Fresh startup without development data | Passed with an in-memory SQLite database on an ephemeral loopback port. |
| Independent official-SDK client | Negotiated **2025-11-25**, discovered **13 tools**, exercised checked recovery, explicit confirmation and protected essential work. No LLM request in this clean-copy smoke test. |
| Credential exclusion | Three configured credential values checked against all five frontend JavaScript assets; none present. The final archive is separately checked against its manifest and credential values. |

This is source/install/database isolation on the same Windows host, not a second physical-machine or cross-platform test. Dependency installation used the network. Shared host services were not uninstalled. Human microphone performance, production load and native Alexa deployment were not tested.

The source package contains current source, lockfile, built frontend, documentation and selected non-secret evidence. Its allowlist excludes `.env`, live data, backups, dependencies, model weights and historical video files. `EXPORT_MANIFEST.json` records per-file SHA-256 hashes; the archive has an adjacent SHA-256 file.

Runtime/frontend/test sources in the final package are compared with the tested export. Later documentation, screenshots and the provider benchmark npm-script selection do not change the tested implementation. No repository publication, video upload or hackathon submission was performed.
