# ReadyBy 0.4 verification — 23 October 2026

Public judge beta: **https://34-10-147-168.sslip.io/**. This report separates automated checks, actual hosted integration and work still requiring a human rehearsal.

| Check | Observed result | Limit |
| --- | --- | --- |
| Automated suite | **64/64 tests passed**, no failures/skips | Domain, MCP/auth/consent, preview, credential constraints, allowances and provider failure behavior; mocked providers where declared. |
| Typecheck and production build | Passed | Does not establish product demand, unlimited traffic capacity or every microphone/browser combination. |
| Public HTTPS | Real certificate accepted; `/healthz` returned 200, version 0.4.0, database ready | Single-server beta; not an availability SLA. |
| Hosted MCP | Official independent SDK initialized protocol **2025-11-25**, discovered **13 tools** and made actual tool calls | Session + CSRF authentication; no generic OAuth/native Echo connection. |
| Hosted native-audio integration | Synthetic 16 kHz speech transcribed as **“The washer has another 15 minutes left.”**; `household_request` reached actual MCP interpretation and `readyby_report_delay` | Synthetic speech, not a human microphone test. |
| Grounded spoken response | **52 audio chunks** returned; spoken transcript described washer readiness 08:21, full finish **08:28**, proposed finish **08:16** and requested on-screen review | One declared integration scenario; not a statistical voice quality evaluation. |
| Human browser smoke test | Owner opened the public HTTPS demo in a full browser and explicitly confirmed **“Yes, voice works”** after the requested microphone scenario | Owner-reported basic success; no recorded quantitative latency, accent or noisy-room evaluation. |
| Exact consent | A short “yes” navigated to the current proposal's review without changing the pending laundry. Scripted first-party confirmation then committed the checked deferral | Scripted confirmation is not proof of human presence. The visible UI review/confirm path was also exercised through browser automation. |
| Hosted state isolation and restart | Session, revision, deferred laundry and 08:16 finish survived a service restart; a separate guest had a different mission and could not read the first household's mission | Process restart, not a regional/disk disaster recovery test. |
| Backup | Daily systemd timer enabled; backup service reported success with SQLite integrity/foreign-key checks | Backups are on the same persistent disk. Off-disk recovery remains launch work. |

The hosted voice check used Gemini Live for audio and **Groq `openai/gpt-oss-120b`** for the actual household intent. Exact protocol methods, measured call latencies and spoken transcript: [hosted check](evidence/live-voice/hosted-check.json). The synthetic source audio is included beside it. [Restart/isolation check](evidence/live-voice/persistence-check.json). Test output and actual UI captures are included in the same evidence directory.

## Product flow checked

The CaseProof reference informed the clear promise, worked example, primary practice action and inspectable proof structure. ReadyBy retains its own visual identity and actual household calculations. The landing page's three examples are computed from fictional scheduler fixtures; they are not pictures presented as a running product.

The UI exposes no-signup private guest entry, visible scenario chapters, a voice-first household display, typed fallback, exact revision review and privacy/scope help. Browser automation exercised a real hosted text request, opening review with “yes”, and the review button. The 1440 px desktop and 360 px mobile captures show actual app states. Both mobile product/demo views had equal viewport and content widths after fixing the navigation overflow. The microphone Start/Stop controls were exercised; that alone does not prove a complete human spoken conversation.

## Before recording/submitting

The owner has confirmed a successful actual-microphone voice smoke test on the public demo. Rehearse the complete recording once using the microphone and speakers intended for the film, preferably in a current full browser over HTTPS. Verify microphone permission, hearing a reply, natural interruption and Stop. In a constrained embedded browser the permission/audio setup can remain pending; typing remains available. Do not describe synthetic audio or typed input as a person speaking live.

Native Alexa access, AWS usage, appliance sensing, push notifications, verified customer adoption, guaranteed departure and large-scale readiness are not claimed. The allowed Alexa+ web simulation has real AI, MCP and checked state; optional platform logos do not replace those facts.

The retained 0.3 benchmark and evidence remain separately labelled. Its 30/30 declared development cases and 56-test export are historical measurements of that selected pipeline, not fresh voice benchmarks or held-out accuracy estimates.
