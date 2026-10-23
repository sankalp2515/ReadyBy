# ReadyBy architecture

The retained SVG/PNG below describe the 0.3 text/MCP and optional Vosk path. Version 0.4 adds the real-time audio layer shown in [Live voice architecture](../LIVE_VOICE.md), and a [public single-server deployment](../HOSTING.md). The domain planner, checker and consent boundary remain shared.

# Retained 0.3 architecture evidence

The SVG and matching PNG use the supplied reference's grouped components, orthogonal arrows, navy modules and record cylinder. MCP is implemented. Hosted providers are labelled separately from local speech/storage. This is a logical flow, not a packet trace.

| Component | Source |
| --- | --- |
| Browser SDK client, discovery and prepared calls | `frontend/src/mcp-client.ts`, `api.ts` |
| Streamable HTTP and tool schemas | `src/platform/server.mjs`, `mcp.mjs` |
| Shared actions, prepared calls and confirmations | `src/platform/missions.mjs` |
| Hosted/local calls and validated intent | `src/readyby/providers.mjs`, `agent.mjs` |
| Bounded clarification | `src/readyby/conversation.mjs` |
| Rules, scheduler, independent checker | `src/readyby/reducer.mjs`, `planner.mjs`, `verify.mjs` |
| Local speech | `src/platform/speech.mjs`, `scripts/speech-worker.py` |
| Session scoping and persistent state | `src/platform/security.mjs`, `database.mjs` |
| Independent SDK client | `scripts/mcp-demo.mjs` |

Interpretation returns a prepared call; the browser invokes the exact selected tool. Direct controls use the same typed tools without an LLM. Approval obtains a confirmation from the dedicated first-party review endpoint. A model-supplied approval boolean is insufficient. The record arrow summarizes proposal/action transactions; UI reads return saved state to the display and inspection view. Local voice output is omitted from the main request path.

Hosted processing sends text and mission context to the configured provider. Local Ollama is separately selectable. Vosk's dashed path covers local PCM transcription and return for review. Native Alexa onboarding/OAuth, AWS and IntentSeal runtime integration are not implemented. Exact evidence and limits: ../READYBY_MCP_VERIFICATION.md.
