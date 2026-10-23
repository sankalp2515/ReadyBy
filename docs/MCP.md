# ReadyBy MCP integration

ReadyBy 0.3.0 uses the official `@modelcontextprotocol/sdk` 1.32.1 on both sides. Protocol: **2025-11-25**. Transport: **Streamable HTTP** with JSON responses. Endpoint: **POST `/mcp`**. No server-to-client event stream is provided; GET/DELETE return 405. Transport state is per request; household state lives in SQLite.

## Run a complete client

Start the application, then run:

```bash
node scripts/mcp-demo.mjs
node scripts/mcp-demo.mjs --live
```

The first requires no model. The second uses the server's configured provider. Both use the official SDK, create a private guest fixture, negotiate, discover and invoke tools. See [the full client](../scripts/mcp-demo.mjs). `READYBY_SERVER` supports another loopback port; this CLI deliberately refuses remote URLs. It is not a general remote-client login program.

## Authentication and messages

The simulator first creates a household session through `/api/auth/demo` or its normal account flow. Requests use the resulting HttpOnly `readyby_session` cookie and `X-CSRF-Token` header. The bootstrap response supplies CSRF to the authenticated client. Provider keys are unrelated to MCP authentication and must never be used as client credentials.

The SDK handles `initialize`, `notifications/initialized`, `tools/list` and `tools/call`; subsequent requests use the negotiated MCP protocol header. Origin and host checks are enforced. The server rejects protocol versions below its accepted 2025-11-25 path. Use the SDK rather than constructing an unauthenticated fetch against the URL.

`GET /api/mcp` describes the endpoint for an authenticated household. Review system displays the actual negotiated version, discovered tool count and recent requests. [Browser SDK client](../frontend/src/mcp-client.ts) · [Server](../src/platform/mcp.mjs)

## Tools

| Tool | Purpose |
| --- | --- |
| `readyby_interpret_request` | Interpret a request and prepare a scoped typed call; clarification may use a bounded rule. |
| `readyby_get_mission` | Inspect state and checked schedule; resolve prepared status/clarification requests. |
| `readyby_report_progress` | Explicitly report starting, completing, pausing or resuming work. |
| `readyby_report_delay` | Report passive wait or remaining effort and obtain recovery proposals. |
| `readyby_edit_task` | Change a task constraint under domain validation. |
| `readyby_set_availability` | Report participant unavailability. |
| `readyby_recalculate` | Generate and check proposals without approving them. |
| `readyby_commit_proposal` | Commit one exact reviewed proposal with its confirmation token. |
| `readyby_reject_proposal` | Reject proposals without erasing disruption or completed progress. |
| `readyby_start_mission` | Start a reviewed draft. |
| `readyby_draft_mission` | Create/revise a draft under task limits. |
| `readyby_advance_demo` | Advance explicitly labelled demo time; never complete tasks automatically. |
| `readyby_resume_deferred` | Resume saved work after explicit readiness and a new deadline. |

Mutation tools require mission ID, expected revision and idempotency key, plus their typed arguments. The actual SDK discovery returns strict schemas; [server definitions](../src/platform/mcp.mjs) are authoritative.

## Conversation and consent

1. `readyby_interpret_request` returns a selected tool and exact arguments with a short-lived opaque prepared token.
2. The client invokes that tool. The service verifies token, arguments, session, household, mission, revision and request key. Preparation expires after 90 seconds.
3. A natural-language approval intent opens review and cannot itself apply a deferral or later departure.
4. The dedicated authenticated `/api/proposals/confirm` endpoint issues a two-minute, single-use token for the displayed proposal and revision. `readyby_commit_proposal` validates it before committing. No MCP tool mints that confirmation.

The first-party review interface/session is trusted. This is not a production OAuth authorization server or proof that a human physically clicked. Prepared/confirmation capabilities are not persisted in domain receipts. Domain transactions protect revision and duplicate writes. [Shared mission service](../src/platform/missions.mjs)

## Remote and native clients

A future hosted first-party web app can use the same-origin `/mcp` endpoint after a verified deployment. An arbitrary third-party MCP client needs a supported authentication/bootstrap path; a URL alone is insufficient. The current CLI intentionally stays local. Native Alexa connection/account linking is not implemented; the hackathon permits the web simulator. [Hosting prerequisites](HOSTING.md)

## Verification

[Protocol/API tests](../tests/mcp.test.mjs) exercise independent SDK clients, authentication/origin/CSRF boundaries, typed changes, prepared-call binding/expiry, exact confirmation, duplicate writes and essential protection. [Recorded evidence](READYBY_MCP_VERIFICATION.md) separates live provider/browser requests from tests using doubles.
