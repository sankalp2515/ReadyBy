> Historical 0.3 handoff. Current hosted voice and UI status: [0.4 verification](READYBY_0_4_VERIFICATION.md), [hosting](HOSTING.md), [live voice](LIVE_VOICE.md).

# ReadyBy 0.3 — current local handoff

23 October 2026. ReadyBy is an Alexa+ simulator with a working self-hosted MCP server. This replaces the earlier simulation-only recommendation. No native Alexa connection, AWS integration or final hackathon submission is claimed.

## Delivered

- Official SDK browser and independent CLI clients, protocol 2025-11-25 and Streamable HTTP at `/mcp`; 13 discovered tools.
- Two-call language workflow: interpretation prepares an exact typed call; the client invokes it through MCP. Prepared calls are scoped and expire.
- Shared domain service; deterministic scheduling, independent verification, transactional household state and receipts.
- Review plus a two-minute, single-use confirmation bound to the exact proposal/revision. Natural-language yes opens review; it does not commit.
- Server-side `.env` loading, Groq 120B inference, Gemini fallback and quota cooldown. Keys never reach frontend code or the export. Ollama remains a key-free local mode; Vosk speech stays local.
- Current architecture SVG/PNG, independent client reproduction, provider evaluation and browser captures.

Start with READYBY_MCP_VERIFICATION.md for evidence and limits. Pitch: **ReadyBy repairs shared household plans when time slips, while preserving reported progress and asking before changing commitments.**

## Start

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
node --test
node app-server.mjs
```

Open http://127.0.0.1:4173. For a separate client, run `node scripts/mcp-demo.mjs` or `node scripts/mcp-demo.mjs --live`. The typed client uses no LLM; live mode consumes configured provider quota. `.env.example` documents settings. The owner's `.env` selects Groq with Gemini fallback. Credentials are excluded from the source archive. Judges can configure their own provider or install the documented local Ollama model.

## Demonstration

Show the 08:19 opening estimate for an 08:20 departure. Label the 08:06 progress fixture. Make an actual washer update, collect minutes, show full finish 08:28 versus retained work 08:16, and prove laundry remains pending before review. Cancel review once; then approve the exact revision. Show preserved completion facts, saved unfinished laundry and reload persistence. In a separate essential case, show that no deferral is available. Briefly expose MCP discovery/tool calls and actual provider receipts. Disclose seeded progress, cuts and inference timing.

The final public video must be below three minutes and demonstrate the working product. `docs/evidence/readyby-mcp-evidence-walkthrough.mp4` is a new **83.5-second narrated walkthrough of actual captured states**, explicitly labelled as not a continuous recording. It shows recovery, MCP inspection and essential protection; it does not show the complete live conversation. Use `READYBY_DEMO_RUNBOOK.md` for the stronger final live take. Older films are historical/reference material. Human microphone performance remains unmeasured; use the verified typed path unless the owner rehearses actual speech.

## Open Source mini-challenge

Selected candidate: [IntentSeal](https://github.com/sankalp2515/intentseal), replacing the proposed schedule-checking library. Its public Apache-2.0 project and event-window feature/test history were reviewed. Include repository URL, substantive contribution URL, GitHub username `sankalp2515`, and what changed/how it works/why it matters. Supporting contribution: [intent contracts](https://github.com/sankalp2515/intentseal/commit/43a188ca68deca6aa2ebd662db20490e596cc67a). Confirm entrant rights and describe the work accurately. No runtime integration with ReadyBy is claimed.

## Remaining delivery gates

Source destination: [sankalp2515/ReadyBy](https://github.com/sankalp2515/ReadyBy), with versioned release v0.3.0. The owner authorized public source and release publication. Current-product public video upload, Devpost fields/entry, and entrant/media rights review remain pending. AWS is not required and no AWS mini-challenge qualification is claimed. Deadline: **24 October 2026, 00:30 IST** per the event rules.

Hosting clarification: the [official FAQ](https://amazonappdev2026.devpost.com/details/faqs) explicitly accepts locally runnable source plus the demo video; the MCP server need not stay running after submission. Keep the repository and reproducible testing path available through judging. An optional hosted demo can reduce setup friction but is a separate deployment task, not an entry requirement. See READYBY_SUBMISSION_CHECKLIST.md for the remaining steps.

The local export is `artifacts/ReadyBy-Local-Submission.zip`, with adjacent SHA-256 and per-file manifest. It excludes `.env`, live databases/account/session records, backups, dependencies and model weights. Historical reports may refer to media not bundled. Current verification records clean-export results. An eligible local prototype does not establish customer demand or a guaranteed shortlist.
