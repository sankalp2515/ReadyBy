# Security policy

## Supported scope

The current development line is **0.3.x**. Earlier prototypes remain for historical context. ReadyBy is a loopback-operated beta; native Alexa OAuth, a public deployment, production load and formal security certification are not provided.

## Report a vulnerability privately

Use this repository's **Security → Report a vulnerability** private reporting option when available. Do not publish keys, cookies, recovery codes, personal household data, exploit details or a live database in an issue. If private reporting is unavailable, open an issue requesting a private contact channel without sensitive technical details.

Include affected version/commit, a minimal synthetic reproduction, expected/observed behavior and potential impact. No response deadline, bounty or guaranteed remediation is promised.

## Operating assumptions

- Provider credentials remain server-side; real `.env` files are ignored.
- Household sessions, CSRF/origin checks and revision/idempotency boundaries are enforced.
- A trusted first-party review flow issues an exact-proposal confirmation; this is not cryptographic human-presence verification.
- Local SQLite files, account records, recovery codes and backups require the operator's filesystem protection.
- Hosted inference sends bounded text/task context to the selected provider. Optional speech is local to the Node deployment; a future remote deployment changes where audio is processed.
- Public hosting requires additional deployment, durable-storage and authentication verification. Do not expose the development server by disabling its protections.

See [MCP boundaries](docs/MCP.md) and [hosting prerequisites](docs/HOSTING.md).
