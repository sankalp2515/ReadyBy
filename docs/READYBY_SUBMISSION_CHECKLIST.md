# ReadyBy — submission verification checklist

Current implementation: **0.4.0**, [public source](https://github.com/sankalp2515/ReadyBy), [versioned release](https://github.com/sankalp2515/ReadyBy/releases/tag/v0.4.0), and [hosted judge beta](https://34-10-147-168.sslip.io/). This checklist does not confirm that a Devpost entry was submitted.

Use [the judge guide](JUDGE_GUIDE.md) for exact testing steps and [current Devpost copy](READYBY_DEVPOST_FINAL.md) for prepared form answers. The earlier 0.3 submission draft is historical.

## Repository and access

- Public GitHub repository with a detectable MIT license, complete source, locked dependencies and setup instructions.
- Original implementation identifiable as **v0.4.0**, commit **d6adb474cf35376ecbfc011b7f6bbbe9369ddeea**. Preserve the tag and original release assets; documentation cleanup must not replace them.
- Hosted guest demo needs no signup or judge-supplied credentials. Provider keys remain server-side. Local reproduction requires a provider or Ollama for language interaction and a funded Gemini key for live voice.
- Current setup, MCP transport, voice data flow and limitations are documented. No native Echo connection, appliance telemetry or AWS integration is claimed.

## Verify in the Devpost entry

- Entrant/team details, representative, eligibility and rights are correct.
- Primary track is **Alexa+**, described as a working self-hosted MCP server demonstrated through our own web simulation.
- Repository URL, hosted demo URL and exact testing instructions are present and accessible.
- Product description explains the customer problem, checked recovery, review/approval, preserved progress and essential-task counterexample.
- Product feedback answers all five required questions for the tools, APIs and SDKs actually used. Concrete developer friction is described accurately; no bonus is guaranteed.
- Public YouTube/Vimeo URL points to the selected working-product demonstration, under three minutes. Verify visibility, audio, captions and media rights. A local MP4 path is not a submission URL. Video clarity, owner approval and public availability must be verified independently; generating a file does not establish those checks.
- Gallery images match the product and have accurate captions. The old 0.3 architecture PNG predates live voice; use the current architecture documentation for the implemented system.
- Confirm the entry is **submitted**, not merely saved as a draft. Keep the confirmation and accepted submission URL. This repository audit does not establish that status.

## Optional Open Source mini-challenge

IntentSeal is a separate candidate, not a ReadyBy runtime dependency. If entered, provide the contribution URL, project repository URL, GitHub username and explanation of what changed, how it works and why it matters. Verify authorship, rights and event-window work.

- Project: https://github.com/sankalp2515/intentseal
- Contribution: https://github.com/sankalp2515/intentseal/commit/43a188ca68deca6aa2ebd662db20490e596cc67a
- Username: `sankalp2515`

Do not select AWS Builder based on this Google Cloud implementation alone.

## Rules and hosting

The [official rules](https://amazonappdev2026.devpost.com/rules) specify repository access, the demonstration video and product feedback. The [official FAQ](https://amazonappdev2026.devpost.com/details/faqs) accepts an Alexa+ web simulation and locally runnable source; hosting and a continuously running MCP server are not required. Our public HTTPS deployment reduces judge setup effort, but does not establish customer demand or a prize outcome.

The published submission deadline was **23 October 2026, 19:00 UTC / 24 October 2026, 00:30 IST**. Do not imply later repository cleanup was completed before that deadline. Verify any entry changes or organizer extensions directly in Devpost.
