# ReadyBy — Devpost submission copy

Prepared 23 October 2026 against the 0.4 implementation and recorded project verification. Each numbered section below maps to a form field. This is prepared copy, not a submitted entry.

## 1. About the project

### Inspiration

There’s a moment in a busy morning when you stop doing your own task and start figuring out everyone else’s.

The bags are packed. Lunch is ready. You need to leave at 8:20. Then the washer needs more time, and someone has to work out what can wait, what still has to happen, and whether everyone can still get out the door.

That invisible coordination work inspired ReadyBy. We wanted a household assistant that could share the responsibility of adapting the plan when circumstances change.

**ReadyBy helps a household protect a shared deadline by understanding what changed, checking the options, and asking before changing commitments.**

### What it does

ReadyBy is a voice-first household coordination agent, demonstrated through an independent Alexa+ web simulation with a working MCP server.

A household member can speak or type a change, such as “The washer needs more time.” ReadyBy asks for missing details, updates the reported state, and checks how the change affects the shared plan. It accounts for who is available, which tasks depend on others, and which activities require attention versus passive waiting.

Our school-run demonstration makes the trade-off visible:

- **Before the disruption:** two adults, seven tasks, an 8:20 departure, and a checked 8:19 finish.
- **After the washer report:** at the labelled 8:06 demo chapter, another fifteen minutes of waiting pushes the full finish to 8:28.
- **With a reviewed recovery:** saving flexible laundry for later allows the remaining departure work to finish at 8:16, leaving four minutes of planned buffer.

Saying “yes” opens the proposal for review. The household approves the exact revision on screen before ReadyBy applies it. Packed bags and prepared lunch stay completed. Deferred laundry stays unfinished and available for later.

If laundry is essential, ReadyBy keeps it in the plan and explains that the original deadline cannot hold under the supplied estimates. A later departure requires agreement.

The scenario seeds fictional time and reported progress; subsequent requests exercise the real application. These times are calculated from task estimates, not measured household time savings or guarantees about physical work.

### How we built it

We built the shared household display in **React and TypeScript**, with a **Node.js** backend and persistent **SQLite** state. The hosted demo runs on **Google Cloud Compute Engine**, served over HTTPS through **Caddy**.

**Gemini Live**, integrated through Google’s Gen AI SDK, supplies bidirectional audio, transcription and spoken replies. The browser receives a short-lived, single-use credential; permanent provider keys stay on the server. Typed interaction provides another way to use the same household tools.

The official **MCP TypeScript SDK** connects the interface to thirteen typed tools over Streamable HTTP. Those tools interpret requests, report progress and delays, inspect schedules, prepare proposals, and commit reviewed changes. An independent SDK client also exercises the server outside the browser.

**Groq’s GPT-OSS 120B** interprets household requests, with a configured **Gemini** fallback. We also implemented a local **Ollama** alternative and optional **Vosk** recorded-speech transcription for local setups.

Our central engineering decision was to give authoritative scheduling to deterministic code. A bounded search calculates candidate plans, and an independent checker validates them. The language model interprets intent; the planner calculates feasibility.

Revision checks, transactional writes and idempotent requests protect saved progress. Consequential changes require a short-lived, single-use confirmation tied to the exact proposal and revision.

### Challenges we faced

**Understanding a request without inventing the missing facts.** In an early local-model run, “The washer needs more time” produced an unsupported twelve-minute estimate. Our validation blocked it and requested an explicit duration. That failure helped us design clarification and scoped follow-ups around information the person actually supplied.

**Making recovery respect household priorities.** We had to distinguish flexible work from essential work, preserve reported completion, and make an infeasible deadline a useful result. A schedule only helps if its trade-offs respect the people using it.

**Keeping voice convenient while making approval precise.** Conversational agreement can be ambiguous. We made “yes” open review, with the final action bound to the displayed revision. A changed or expired proposal requires fresh review.

**Handling real provider and deployment limits.** Quota errors, inconsistent intent extraction and live-audio billing prerequisites required explicit fallback behavior, validation and inspectable error reporting. Persistent household state also shaped our hosting choice: a VM with durable SQLite fit the current implementation.

### Accomplishments we’re proud of

We completed the loop from a real spoken request through MCP tools, checked planning, visible approval and persistent household state.

Our recorded 0.4 verification reports **64 passing automated tests**, successful type checking and a production build. Hosted integration evidence shows actual audio transcription reaching the household tools and producing a grounded spoken response. Browser checks exercised review and approval; restart checks preserved the saved recovery. A basic human microphone smoke test was also confirmed.

We’re especially proud of the essential-laundry case. It demonstrates that ReadyBy can explain when a deadline no longer works while keeping the household’s priorities intact.

### What we learned

We learned that reliable agents need clear boundaries between interpretation, calculation and authorization. Valid JSON can still express the wrong action. A convincing spoken answer can still describe an invalid schedule. Time passing cannot establish that someone completed a physical chore.

Those lessons shaped the product: clarify missing facts, independently check plans, preserve reported progress, and ask people to approve the trade-offs that affect them.

### What’s next for ReadyBy

We want to evaluate repeated use with real households, broaden the planning model beyond the current one-to-two-adult, eight-task scope, and test voice interaction across accents and noisy environments. Native Alexa integration would require the appropriate platform access and account-linking work; the current project is an independent web simulation with real AI and MCP execution.

Our aim is to give the person coordinating everyone’s morning a shared, checked next move when the morning changes.

## 2. Built with

Enter these as individual tags; 18 total:

TypeScript, JavaScript, React, Node.js, Vite, pnpm, SQLite, Model Context Protocol, Zod, Google Gen AI SDK, Gemini API, Gemini Live API, Groq API, Ollama, Python, Vosk, Google Cloud Compute Engine, Caddy

Ollama and Vosk are optional local paths. Python supports the optional speech setup. Alexa+ is the simulation target, not an integrated native SDK. NVIDIA was evaluated but is not the selected runtime. AWS and IntentSeal are not ReadyBy runtime dependencies.

## 3. Testing instructions or credentials

**Live demo:** https://34-10-147-168.sslip.io/

No signup, judge password, API key or Echo device is needed for the hosted guest demo. Use a current desktop browser with microphone access for voice, or type the same requests.

1. Open the link and choose **Try the live demo**. If shown an entry screen, choose **Explore a private demo**. A returning session may show **Return to workspace**.
2. In the household display, choose **1 · Ordinary morning**. The fictional school-run plan finishes at **08:19** for an **08:20** departure.
3. Choose **2 · Washer delay**. This seeds fictional progress at **08:06**, including reported bag and lunch completion; it does not inject the request below.
4. Choose **Start live voice**, allow microphone access and say: **“The washer has another fifteen minutes left.”** Alternatively, type that sentence and send it. To test clarification separately, start with **“The washer needs more time”** and answer **“Fifteen minutes”** when asked.
5. Inspect the **08:28** full finish and proposed **08:16** recovery with flexible laundry saved for later. The **Schedule** tab shows the timing.
6. Say or type **“Yes.”** This opens review without applying the proposal. Choose **Approve this revision**. Check that departure remains **08:20**, completed work is preserved and laundry is deferred, not completed.
7. Reload the page to verify the saved plan. Open **Review system** to inspect MCP connection details and execution evidence.
8. After checking persistence, choose **3 · Essential stays protected**. This loads a different seeded chapter into the demo. Report the same delay. Essential laundry must remain in the plan; any later departure remains a proposal until approved.

Voice sessions end after three minutes; **Stop voice** closes the session. If microphone permission is denied or voice quota is exhausted, use typed interaction. The application is an Alexa+ web simulation, with no native Echo connection or wake word.

**Local reproduction:** source and detailed setup are at https://github.com/sankalp2515/ReadyBy. Requires Node.js 22.20+ and pnpm 11.25.0:

```bash
git clone https://github.com/sankalp2515/ReadyBy.git
cd ReadyBy
pnpm install --frozen-lockfile
pnpm build
node app-server.mjs
```

Open http://127.0.0.1:4173. Direct task controls and typed MCP demonstrations work without an LLM key. Natural-language interpretation requires a configured hosted provider or the documented local Ollama model; live voice additionally requires a funded Gemini API key. Hosted-demo credentials are already managed server-side.

## 4. Feedback Question 1: Which developer tools, APIs, and SDKs did you use and for what?

- **Official MCP TypeScript SDK:** browser and independent CLI clients, Streamable HTTP server, discovery and invocation of thirteen household tools.
- **Google Gen AI SDK, Gemini Live API and Gemini API:** real-time audio, transcription, spoken replies, short-lived browser credentials and fallback text-intent interpretation.
- **Groq API:** primary hosted household-intent extraction with GPT-OSS 120B. The application validates the output before executing tools.
- **Ollama API:** optional local intent interpretation and model availability checks during development and local execution.
- **Vosk and Python:** optional server-side recorded-speech transcription with transcript review; not installed on the hosted beta.
- **React, TypeScript, JavaScript, Vite, pnpm and Zod:** interface, application logic, locked builds, type checking and runtime schemas. Node.js provides the backend and test runner; SQLite stores household state and history.
- **Google Cloud Compute Engine and Caddy:** hosted HTTPS judge demo with persistent storage and process supervision.

We used Amazon’s Alexa+/hackathon documentation to select and design the simulation path. We did not use a native Alexa SDK, connect an Echo, or deploy this project on AWS. NVIDIA inference was screened experimentally but is not a selected runtime provider.

## 5. Feedback Question 2: For each tool, API, or SDK used, what worked well?

- **MCP SDK:** the official client and server let us verify a real protocol handshake, tool discovery and execution through both the browser and an independent client. Typed tools made the action boundary inspectable.
- **Gemini / Google Gen AI SDK:** live transcription, audio replies and tool requests supported the hands-busy household workflow. Ephemeral credentials let us connect the browser without distributing permanent keys. Gemini also supplied useful fallback interpretation when Groq hit quota limits.
- **Groq:** responsive hosted interpretation in our selected pipeline. Our thirty-case development evaluation, using Groq with Gemini fallback and application validation, passed all declared cases. This was a prompt-informed development set, not a held-out accuracy benchmark.
- **Ollama:** simple local HTTP integration and a local inference option. Existing installed models let us begin without a hosted provider key.
- **Vosk / Python:** a checksum-verified model and isolated environment supported reproducible local transcription. A synthetic “fifteen minutes” clip passed through the speech service and browser flow.
- **Application stack / SQLite:** TypeScript and Zod supported explicit data contracts; Node’s test runner supported domain/API checks. SQLite transactions and revision checks preserved approved state across restarts. React and Vite supported the shared display and production build.
- **Compute Engine / Caddy:** a single VM preserved the current SQLite design while providing public HTTPS access. We verified service restart persistence and database backup integrity.

## 6. Feedback Question 3: For each tool, API, or SDK used, what needs work?

- **MCP:** our integration required careful handshake/session handling during repeated state polling. We would welcome more end-to-end examples covering authenticated browser sessions, revision conflicts and exact-proposal approval. MCP itself does not supply those application policies.
- **Gemini / Google Gen AI SDK:** a new project could mint live credentials but inference returned HTTP 402 until AI Studio prepayment requirements were addressed. Clearer guidance connecting Cloud billing, API funding, token issuance and actual inference readiness would reduce onboarding uncertainty. Earlier text runs also needed semantic guards around recalculation and passive waits.
- **Groq:** HTTP 429 responses interrupted development evaluation. We added explicit attempt records, cooldown and configured fallback. Examples combining structured output with quota-aware recovery would help.
- **Ollama:** a Windows launcher on PATH opened the GUI rather than giving the expected CLI result. Endpoint checks provided a workaround. Model output also sometimes selected the wrong action or invented missing durations despite valid JSON; our application added clarification and semantic validation. These are observations about our setup and tested models.
- **Vosk / Python:** model download, Python environment and audio conversion add setup steps. Our synthetic checks do not establish human accent or noisy-room accuracy; we need wider testing before making those claims.
- **Application stack / SQLite:** no blocking framework defect is established by our evidence. Our work was implementing request limits, errors, state isolation and consent boundaries. SQLite’s single-server design also means autoscaling requires further architecture work.
- **Compute Engine / Caddy:** the VM approach leaves patching, backup operations and scaling with us. Our current same-disk backups are not disaster recovery. These are deployment trade-offs, not cloud outages encountered during testing.
- **Alexa documentation:** selecting the permitted entry path required cross-checking resources, rules and FAQ. Put simulation eligibility and native-access prerequisites together, with a runnable example showing tool calls, persistence and approval. We did not encounter a native SDK runtime error because we did not integrate that SDK.

## 7. Feedback Question 4: For each tool, API, or SDK used, how was onboarding?

- **MCP SDK:** we integrated the official SDK, then checked initialization, discovery and actual calls using an independent client. Most application work concerned authenticated state and authorization around the tools.
- **Gemini / Google Gen AI SDK:** the path extended beyond a first model response: ephemeral credential issuance, browser microphone access, audio playback and actual tool execution all needed checking. Funding a new project was a concrete source of friction.
- **Groq:** server-side API integration got us to hosted intent extraction; quota handling and task-specific semantic evaluation were needed to make it dependable for the demo.
- **Ollama:** we started with an existing service and installed models, so this was not a clean-machine installation. Direct endpoint checks resolved the launcher issue; we then evaluated structured intent against declared cases.
- **Vosk / Python:** onboarding required an isolated environment, model download and speech worker before an end-to-end transcription check. We verified a synthetic clip first and kept broader human speech evaluation separate.
- **Application stack / SQLite:** a locked pnpm install, type checking and production build provided a reproducible source path. Transactional state and exact-revision approval took more work than the initial interface.
- **Compute Engine / Caddy:** deployment required a persistent database location, service supervision, HTTPS, origin configuration and restart/backup checks. That was a fuller setup than static frontend hosting because judges exercise a stateful backend.
- **Alexa ecosystem:** the documented simulation path let us demonstrate the idea without partner-gated native access. Finding that distinction across several pages added avoidable setup uncertainty.

## 8. Feedback Question 5: Would you build with these devices and services again?

**Yes.** We would use MCP for explicit, inspectable tools; Gemini Live for conversational audio; and Groq with configured fallback for hosted intent interpretation. We would retain semantic validation, independent scheduling checks and exact-action approval around model output.

We would use Ollama and Vosk again when local processing is a priority, with hardware-specific latency and human speech testing. React, TypeScript, Node.js and SQLite suited this bounded prototype, and Compute Engine with Caddy provided a practical stateful judge deployment. A larger service would require additional storage, operations and scaling work.

We would continue exploring Alexa+ because hands-busy household coordination fits conversational interaction. We have not evaluated Echo hardware or a native Alexa SDK in this project, so we cannot claim a device integration experience.

## 9. Image gallery — upload order and captions

Use the five copied PNGs in `artifacts/devpost-gallery`. All are actual existing product captures, retained at their original dimensions, and each is below 5 MB. They are not newly captured screenshots. The supplied 3:2 ratio is a recommendation; these originals retain other ratios to preserve interface context.

1. **01-household.png:** “One shared departure time, a voice-first household display, and a checked recovery saved for the morning.” This capture shows the approved 08:16 result in conversation.
2. **02-review.png:** “The household decides: review an 08:16 finish while keeping departure at 08:20. Saying yes opens review; the button approves the exact revision.”
3. **03-essential.png:** “When laundry is essential, ReadyBy keeps it in the plan. Moving departure to 08:28 requires agreement.” Earlier recorded UI; its local recorded-speech controls differ from the current hosted live-voice UI.
4. **04-mcp-proof.png:** “Real MCP: thirteen discovered tools, inspectable protocol requests, a provider receipt and a passed schedule check.” Earlier recorded system-review UI.
5. **05-landing.png:** “ReadyBy: a shared deadline and a plan that adapts. Enter the guided demo to try the household workflow.”

Do not use the existing architecture PNG unchanged: it predates live voice and still describes localhost-only scope. A replacement architecture image would need to reflect the hosted Gemini Live path.

## Editorial and verification notes — do not paste as form answers

- Rechecked public `/healthz` in this pass: HTTP 200, version 0.4.0, database ready. This is a health check, not a fresh end-to-end browser or microphone run.
- Verification claims in the story refer to recorded project evidence; tests were not rerun for this writing-only change.
- Current chapter labels were checked against the frontend source. The third chapter loads a seeded state; inspect saved recovery before switching chapters.
- The original attached draft is context, not proof. Updated hosting and human microphone claims come from current repository evidence.
- Markdown uses the headings, bold, lists and links described by Devpost: https://help.devpost.com/article/193-markdown-tips. LaTeX is supported but unnecessary for this story.
- Main technical sources: README.md, docs/LIVE_VOICE.md, docs/HOSTING.md, docs/READYBY_0_4_VERIFICATION.md, docs/READYBY_MCP_VERIFICATION.md and docs/READYBY_PRODUCT_FEEDBACK.md.
- Alternate opening, if a shorter hook is preferred: “You need to leave at 8:20. The plan has one minute to spare. Then the washer needs more time, and the whole household’s morning needs a new plan.” The longer recommended opening leads with the person carrying the coordination work.
