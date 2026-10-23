> Current 0.3 startup, provider and MCP instructions are in README.md and READYBY_MCP_VERIFICATION.md. This earlier operations reference remains useful for local speech installation; older runtime descriptions are historical.

# ReadyBy 0.2 local private-beta operations

The supported and tested target is a single Node process on this Windows machine, loopback HTTP, a local SQLite file and local Ollama. The current Node 22.20 runtime reports `node:sqlite` as experimental. A public rollout must validate its chosen supported Node release and storage/runtime behavior before release.

## Start

Install locked dependencies with `pnpm install --frozen-lockfile`, run `pnpm typecheck`, `pnpm build`, then `node app-server.mjs`. The development environment has a bundled pnpm executable if the system npm shim is broken. Its location is machine specific; a fresh checkout uses a normal official Node/pnpm installation.

`GET /healthz` checks that the HTTP process is responding. Authenticated `/api/runtime` checks the configured model's presence. A healthy HTTP process does not prove model capacity or quality. Model failure leaves the saved mission unchanged and task controls remain available. UI polling refreshes saved state every 15 seconds; there is no background notification delivery.

Configuration: `PORT` (4173), `READYBY_DATABASE` (`data/readyby-platform.sqlite`), `READYBY_OLLAMA_URL` (`http://127.0.0.1:11434`), `READYBY_MODEL` (`llama3:8b-instruct-q4_K_M`). Environment files are documentation only; the server does not auto-load them. The listen address is loopback. `NODE_ENV=production` requires HTTPS `READYBY_ORIGIN`; it enables Secure cookies and exact host/origin matching. This is a configuration guard, not a verified TLS deployment. Vite dev proxy is for development only; use the built static assets for review.

## Data and access

Account names and participant names are user supplied. Sessions last seven days, use random tokens with hashed database lookup and HttpOnly SameSite cookies. Account passphrases use scrypt. CSRF tokens are held in UI memory. Recovery codes are one-use and rotate; recovering signs out all existing sessions. There is no email reset or support override. Household invitations expire in seven days and can be used once. Members have mission access; owners manage membership, templates, household fields and deletion. Removing a member invalidates their sessions in that household. Members with several households can switch in Household details.

Accounts, sessions, household conversation, task state and event receipts live in the SQLite file. SQLite is not application-level encrypted. The OS account and disk controls must protect its directory. Household export contains mission data, not password hashes or session secrets. An owner can permanently delete a household after typing its name. Guest demo sessions cannot invite people and have no recoverable account passphrase. They are intended for evaluation, not durable customer accounts.

The app neither records microphone audio nor calls external messaging/device APIs. The microphone button explains voice availability. Text is sent to the configured Ollama host. Keep that host trusted and local; changing it changes the data boundary.

## Verified backup / restore procedure

1. Run `node scripts/backup.mjs`. It creates a new consistent snapshot with `VACUUM INTO`, without overwriting files, and checks SQLite integrity plus foreign keys.
2. Run `node scripts/restore-check.mjs backups/<snapshot>.sqlite`. It opens the copy read-only and prints consistency and row counts without personal content.
3. To rehearse restoration, stop the app, set `READYBY_DATABASE` to the snapshot (or a new copy), and start the app on another port. Sign in and verify household, mission, revision and saved routine. Do not copy only a live database's main file while its WAL is active.
4. Keep snapshots private. They include account hashes, recovery hashes and active session records. A restored snapshot can reintroduce sessions and old recovery credentials; rotate/revoke credentials after a real restore. Backups are outside household deletion scope and require a retention policy before external launch.

Signals SIGINT/SIGTERM stop accepting new connections, close storage and exit, with a ten-second fallback. Single-process transactions protect state writes. Do not start multiple app processes against the same product data and claim it is a validated scaling architecture. Schema creation is idempotent at user_version 1; there is no tested rolling migration or rollback system yet.

## Public release gates still open

Hosted HTTPS and reverse-proxy headers; model concurrency and latency on actual deployment hardware; independent security review; broad accessibility audit; tested backup retention/incident ownership; recovery and support policy; guest/account cleanup and quotas; privacy notice and data retention approval; real household outcome evidence. These are observable release gates. Installing a plugin or passing local tests does not close them.

Shipping this as a native Alexa+ product would additionally require the corresponding Amazon runtime/device integration and distribution path. The current simulation is the hackathon delivery path, not evidence that native release has been completed.

## Optional local speech (23 October integration)

Run `python scripts/setup-speech.py` before starting the app. Tested on Windows with Python 3.12. The setup installs pinned Python dependencies in `.venv-speech` and verifies the publisher model archive checksum before extraction into ignored `data/speech`. `READYBY_SPEECH_PYTHON` and `READYBY_SPEECH_MODEL` override paths. Authenticated `GET /api/speech` starts/checks the local worker; CSRF-protected `POST /api/speech/transcribe` accepts bounded PCM16 audio. The worker processes audio in memory and closes with the server. It uses no external recognition API. Household conversation stores submitted transcript text like typed requests; raw audio is not saved. Speech is optional and typed/domain controls remain available. Spoken browser output requires an installed local English voice. Local speech is not native Alexa+ integration.
