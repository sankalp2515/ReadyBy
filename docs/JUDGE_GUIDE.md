# ReadyBy — judge guide

**ReadyBy helps a household adapt its shared plan when a chore runs late: understand the change, check the trade-off, and ask before changing commitments.**

[Open the hosted demo](https://34-10-147-168.sslip.io/) · [Source](https://github.com/sankalp2515/ReadyBy) · [Original v0.4.0 release](https://github.com/sankalp2515/ReadyBy/releases/tag/v0.4.0)

This is an independent **Alexa+ web simulation with a working MCP server**, real inference and persistent state. No Echo device, signup or judge-supplied API key is needed for the hosted guest demo. The server manages provider credentials. It has no appliance or sensor connection.

## Try the product

Use a current Chrome or Edge browser. Voice requires microphone permission; typing exercises the same household tools.

| Step | Action | Expected result |
| --- | --- | --- |
| 1 | Choose **Try the live demo**, then **Explore a private demo** if prompted. Returning users may see **Return to workspace**. | A private guest household opens. |
| 2 | In the household display, choose **1 · Ordinary morning**. | Two adults, seven tasks, an **08:20** departure and a checked **08:19** finish. |
| 3 | Choose **2 · Washer delay**. | The labelled chapter seeds fictional **08:06** progress: bag and lunch reported complete. It does not inject a spoken request. |
| 4 | Choose **Start live voice** and say **“The washer has another fifteen minutes left.”** Or type that sentence. | All work now finishes **08:28**. Saving flexible laundry for later produces a proposed **08:16** finish for departure work. |
| 5 | Say or type **“Yes.”** | Review opens. The proposed deferral has not been applied. |
| 6 | Choose **Approve this revision**. | Departure stays **08:20**. Completed work stays complete; laundry is deferred and unfinished. |
| 7 | Stop voice and reload. | The approved plan and reported progress remain saved. Reload proves persistence across refresh, not a server restart. |
| 8 | After checking persistence, choose **3 · Essential stays protected** and report the same delay. | Essential laundry remains in the plan. **08:28** is the feasible full finish; changing departure requires review. |

Chapter selection replaces the current demo scenario. Inspect saved progress before switching. To test clarification separately, use **“The washer needs more time”**, then answer **“Fifteen minutes”** when asked.

The timings come from editable estimates and user reports. They are not measured time savings or a guarantee that a household will depart on time. Deferred laundry has not vanished or been completed.

## Inspect the engineering

Open **Review system** to inspect protocol requests, discovered tools, actual provider receipts and checked planning results.

| Layer | What to inspect |
| --- | --- |
| Real-time voice | Gemini Live audio, actual input transcript and spoken tool result. Saying yes opens review; it cannot press approval. |
| MCP | Official SDK, **2025-11-25**, Streamable HTTP at `/mcp`, **13 tools**. The browser initializes, discovers and calls tools. |
| Interpretation | Groq intent extraction, configured Gemini fallback, semantic validation and clarification. |
| Scheduling | Deterministic bounded search and a separate schedule checker; model prose is not authoritative scheduling. |
| Approval and state | Exact-proposal confirmation, revision checks, transactional SQLite and receipts. |

[Current architecture](architecture/README.md) · [0.4 verification and limitations](READYBY_0_4_VERIFICATION.md) · [MCP tool catalogue](MCP.md)

## If voice is unavailable

Voice sessions last up to three minutes and the public beta has usage allowances. If permission, quota or provider availability prevents voice, use typed interaction. Typed interpretation still needs an available configured provider. Direct task controls and the local typed MCP smoke test do not require an LLM.

If the hosted server is unavailable, reproduce the released application locally:

```bash
git clone https://github.com/sankalp2515/ReadyBy.git
cd ReadyBy
pnpm install --frozen-lockfile
pnpm build
node app-server.mjs
```

Use **Node.js 22.20+** and **pnpm 11.25.0**, then open `http://127.0.0.1:4173/`. For the exact original implementation, check out tag `v0.4.0` before installing. Natural-language interaction needs your own configured provider or local Ollama; live voice additionally needs a funded Gemini API key. [Full setup](SETUP.md).

With the local server running, a second terminal can run `node scripts/mcp-demo.mjs` to independently exercise MCP without an LLM request. `--live` also invokes your configured model and consumes quota. CLI confirmation is scripted integration evidence, not a human approval demonstration.

## Submission boundary

The original implementation is preserved in **v0.4.0**, commit **d6adb474cf35376ecbfc011b7f6bbbe9369ddeea**. Subsequent repository cleanup clarifies documentation and narrows test discovery; it does not add product functionality or replace that release. Devpost submitted status and the accepted video URL must be verified in the entrant's account.
