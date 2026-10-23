# Security policy

## Supported scope

The current development line is **0.4.x**, with a public single-server judge beta and a locally runnable application. The immutable v0.4.0 release identifies the original implementation. Native Alexa OAuth, production-scale validation and formal security certification are not provided.

## Report a vulnerability privately

Use this repository's **Security → Report a vulnerability** private reporting option when available. Do not publish keys, cookies, recovery codes, personal household data, exploit details or a live database in an issue. If private reporting is unavailable, open an issue requesting a private contact channel without sensitive technical details.

Include affected version/commit, a minimal synthetic reproduction, expected/observed behavior and potential impact. No response deadline, bounty or guaranteed remediation is promised.

## Operating assumptions

- Provider credentials remain server-side; real `.env` files are ignored.
- Household sessions, CSRF/origin checks and revision/idempotency boundaries are enforced.
- A trusted first-party review flow issues an exact-proposal confirmation; this is not cryptographic human-presence verification.
- Local SQLite files, account records, recovery codes and backups require the operator's filesystem protection.
- Hosted inference sends bounded text/task context to the selected provider. Live voice streams audio from the browser to Google using a short-lived credential. ReadyBy does not store raw microphone audio; transcripts and action receipts are persisted. Optional Vosk transcription runs on the ReadyBy server.
- The hosted beta uses HTTPS, secure cookies, origin checks, usage allowances and durable SQLite on a single VM. Same-disk backups are not disaster recovery; independent load and broader security reviews remain outstanding. Do not expose development servers by disabling their protections.

See [MCP boundaries](docs/MCP.md) and [hosting prerequisites](docs/HOSTING.md).
