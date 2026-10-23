# ReadyBy — remaining submission steps

Checked 23 October 2026 against the [official rules](https://amazonappdev2026.devpost.com/rules), [submission requirements](https://amazonappdev2026.devpost.com/#requirements) and [FAQ](https://amazonappdev2026.devpost.com/details/faqs). This is a preparation checklist; no signed-in submission form or actual submitted status has been verified.

## Apart from GitHub publication and the final video

1. Verify Devpost registration and complete entrant/team details; designate the representative if entering as a team. Confirm eligibility and rights.
2. Select Alexa+ as primary track. Describe the entry as a working self-hosted MCP server demonstrated through our own Alexa+ web simulator. Do not claim native Echo connectivity.
3. Complete the project description from READYBY_SUBMISSION.md: customer problem, functionality, architecture, meaningful differentiator, actual validation and limitations. State event-window work accurately and distinguish any pre-existing material. Choose current product screenshots and the architecture image for a clear presentation.
4. Complete mandatory product feedback for the tools/APIs/SDKs actually used: use, what worked, what needs work, onboarding and whether we would use them again. Start from READYBY_PRODUCT_FEEDBACK.md. Include the actual MCP SDK and model providers; avoid claiming gated Alexa tooling or AWS use.
5. Add genuine, relevant friction entries as the optional judging-bonus evidence: task, steps, expected/actual, severity, workaround and actionable suggestion. The bonus is assessed, not automatic.
6. Select the Open Source mini-challenge if entering IntentSeal. Supply its contribution URL, project repository URL, GitHub username and explanation of what changed/how it works/why it matters. Use the reviewed links in READYBY_SUBMISSION.md and confirm entrant authorship/rights. Do not select AWS Builder for this implementation.
7. Supply exact testing instructions: Node 22.20+, frozen pnpm install, build, server startup, private demo, MCP SDK script, demo chapter labels and expected recovery. Full language interaction needs a configured hosted provider or installed local Ollama model. Do not put keys in public files. Ordinary typed controls/MCP smoke tests work without an LLM. Human microphone rehearsal is needed only if speech is featured.
8. Review all required signed-in form fields, links and access as a judge would. Public source needs its license; private source needs the specified reviewers. Keep the submitted version identifiable and available through judging. Finalize and verify the entry is submitted rather than saved as a draft before **24 October 2026, 00:30 IST**.

## Hosting decision

The FAQ explicitly says locally runnable public source plus video is enough, and that the MCP server need not stay online after submission. The server can run on the developer's own machine. A web page sending real initialization, discovery and tool calls is an accepted demonstration; native Alexa developer access is partner-gated.

For our local demo, start `node app-server.mjs`, open `http://127.0.0.1:4173/`, and use READYBY_DEMO_RUNBOOK.md. The React client calls `/mcp` on that local Node backend. Hosted model inference still needs internet; MCP itself does not need a public URL.

An optional hosted demo would deploy the entire Node application plus built frontend, HTTPS, server-side secrets and persistent SQLite storage. The current launcher binds to loopback, so remote exposure requires a deliberate deployment configuration and verification. Static frontend-only hosting cannot run this backend, MCP endpoint or SQLite. Do not present a localhost link as remote judge access.

Recommendation: finish the entry and convincing live local take first. Add an optional hosted demo only if it can be tested without delaying the submission. Hosting itself is not evidence of customer value.

## Convincing Alexa+ simulation

Use the household display as the shared visual surface. Show a real incomplete request, missing-minutes clarification, stateful follow-up and checked proposal. Show natural consent opening review, exact approval, saved completion and unfinished deferred laundry. Inspect actual MCP/provider receipts briefly. In the separate essential case, refuse deferral and preserve the unapproved departure. Seeded progress and cuts must be labelled. Rehearse actual local speech and spoken output before featuring them; do not imply a native wake word or native Alexa voice is connected.
