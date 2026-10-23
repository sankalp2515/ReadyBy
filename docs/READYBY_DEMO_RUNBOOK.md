# ReadyBy 0.4 demonstration runbook

Use [the hosted HTTPS demo](https://34-10-147-168.sslip.io/) or the built application at `http://127.0.0.1:4173/`. Keep the Alexa+ simulation and demo-time labels visible. Target **2:40**, always under three minutes. The local narrated evidence montage is labelled captured product states; it does not replace a convincing live interaction recording.

For the voice architecture, provider data flow and three-minute session limits, see [Live voice](LIVE_VOICE.md). Before filming, rehearse a full human microphone conversation: synthetic audio checks do not measure a person speaking in your room.

## Before recording

Start `node app-server.mjs`; the ignored `.env` loads server-side. Check Review system for the configured provider, actual MCP protocol 2025-11-25 and 13 tools. Try one live request before recording; do not exhaust provider quota with a full benchmark. Close consoles/terminals that might expose credentials. Use a desktop viewport, readable browser zoom and a quiet room. Typed conversation is an allowed simulation input. If demonstrating speech, rehearse your own microphone/transcript and audio output first; synthetic clip tests do not establish human recognition quality.

Use a private demo mission. The chapter buttons seed progress/time and must be labelled honestly. Do not overwrite a household's real routine for a film. The previously verified approved mission and separate essential mission are evidence, not hidden scripts to impersonate a new live run.

## Capture sequence

| Time | Actual action | Point to make |
| --- | --- | --- |
| 0:00–0:15 | Household display, morning chapter. Show 08:20 and checked 08:19. | “One changed estimate can force a household to rebuild the whole morning.” |
| 0:15–0:28 | Explicitly select the Washer disruption chapter, which seeds 08:06 and reported bag/lunch completion. | “These progress facts are seeded for this demonstration. The following conversation runs live.” |
| 0:28–0:48 | Start live voice. Say “The washer needs more time.” Wait for the question, then say “Fifteen minutes.” | Missing information is requested. The bounded follow-up uses the answer without another model request. |
| 0:48–1:10 | Show full finish 08:28 against 08:20, and laundry-deferral preview finishing 08:16. | “A checked trade-off preserves completed work and the original departure.” |
| 1:10–1:30 | Say “Yes.” Show review, cancel once if time permits, then explicitly press Approve this revision for the displayed deferral. | Language consent cannot silently commit a changed plan. Laundry becomes deferred and stays unfinished; bag/lunch remain complete. |
| 1:30–1:52 | Open Review system: MCP connection and actual AI/domain receipts. | Real initialize/list/call, actual provider/model/latency, typed tool, verified schedule. Never show `.env` or browser cookies. |
| 1:52–2:05 | Reload, return to household display. | The approved state and reported completion survive refresh. A separate restart test is documented; reload alone is not a restart. |
| 2:05–2:30 | Clearly label a separate Essential laundry chapter; say “The washer has fifteen minutes left.” | No deferral is offered for an essential task. Earliest finish is 08:28; the 08:20 commitment remains unchanged without review. |
| 2:30–2:40 | Close on the household outcome and brief scope caption. | “ReadyBy repairs a shared deadline while keeping people in control. Real MCP and AI, demonstrated through an Alexa+ web simulator.” |

Keep actual elapsed time or label cuts. The incomplete request and typed follow-up are separate turns. If quota/latency prevents a convincing take, fix the configured runtime and record again; do not replace the result with scripted assistant output. Show the essential counterexample even if a branding introduction must be shortened.

## Technical backup

`node scripts/mcp-demo.mjs` creates a private fixture and proves official-SDK interoperability without LLM calls. `--live` additionally exercises actual inference. Its scripted confirmation is an integration test, not human approval evidence. Both reports are included under `evidence/mcp-integration/`.

Use `READYBY_MCP_VERIFICATION.md` for the 30-case provider results, 56-test source-export checks and real browser receipts. Avoid claiming native Echo access, appliance sensors, push services, AWS integration, proven customer adoption or guaranteed time savings.

## Final delivery

Upload the current final recording to the required public YouTube/Vimeo destination after owner review, then enter its URL with the GitHub source/access details. Nothing has been uploaded or submitted by this implementation pass. Entrant rights, team information, reviewer access and optional mini-challenge fields remain owner-controlled.
