# Hosting ReadyBy

## Hackathon eligibility

AWS hosting is not a requirement of the Alexa+ primary track. The [official rules](https://amazonappdev2026.devpost.com/rules) specify a working Agent Skill/MCP server or the allowed simulated experience. AWS Builder is a separate optional mini-challenge requiring documented qualifying use.

The [official FAQ](https://amazonappdev2026.devpost.com/details/faqs) says locally runnable public source plus the video is enough and the MCP server need not remain online after submission. Hosting on Google Cloud is therefore compatible with the stated primary-track requirements; it does not by itself qualify for AWS Builder.

## What a hosted judge experience would be

```text
Judge's browser over HTTPS
          |
          v
ReadyBy frontend + Node application
          |-- authenticated /mcp (real SDK initialize/list/call)
          |-- configured Groq/Gemini interpretation
          |-- deterministic planner + independent checker
          `-- durable household/account/session storage
```

Deploying the full application lets a judge open a private demo and use the MCP-backed experience in their browser. The MCP endpoint should remain authenticated. An arbitrary external MCP client does not become compatible just by learning the endpoint URL; it needs a supported authentication flow. The current independent CLI is loopback-only. Native Alexa registration remains separately gated and is not unlocked by hosting.

## Current release and required changes

Version 0.3.0 is a verified local release. It has not been remotely deployed. Before deployment:

1. Configure a deliberate server bind address. `app-server.mjs` currently listens only on `127.0.0.1`; container ingress must be reachable from its reverse proxy.
2. Build and serve the React frontend and Node backend together. Static hosting alone cannot run the MCP tools or database.
3. Set the real HTTPS `READYBY_ORIGIN`, production secure cookies, and verify origin/host/CSRF behavior through the chosen proxy.
4. Store inference credentials server-side using the provider's secret mechanism. Supply a verified provider with quota; never include `.env` in an image or frontend bundle.
5. Provide durable transactional storage and backups. Test restart/redeploy behavior for accounts, sessions, missions and consent state.
6. Test two independent browsers/households, live AI, stale revisions, review/cancel/confirm, persistence and server failure. Check the actual public UI and MCP trace.
7. If speech is included, install its Python/Vosk worker and model in the deployment and rehearse microphone access over HTTPS. A remote speech worker receives microphone audio on that server; update privacy language accordingly. The present “local speech” label describes the local deployment.

These steps are deployment work, not features claimed in this release.

## Google Cloud options

**A single Compute Engine VM with a persistent disk** is a candidate that preserves the existing single-server SQLite architecture. It still needs process supervision, HTTPS, secret management, backups and verification. No VM has been provisioned and no cost estimate is promised.

**Cloud Run** can serve a Node/MCP application, but it requires a storage design change for durable ReadyBy household state. Google's [container contract](https://docs.cloud.google.com/run/docs/container-contract) requires listening on `0.0.0.0` and the injected `PORT`; its default writable filesystem is memory-backed and disappears when the instance stops. Limiting instance count does not make that storage durable. A managed database migration is additional implementation; Cloud SQL is not a drop-in replacement for Node's SQLite adapter.

Do not put the SQLite database in an ordinary Cloud Run filesystem and call the product persistent. Review SQLite locking/WAL requirements before proposing any network-filesystem workaround. Prepared-call and confirmation caches are currently in process, so restarts or multiple replicas can require a fresh review; a scaled deployment needs a suitable shared design or an explicitly verified single-server model.

## Recommendation

The local demo/source path is already verified. If adding a hosted demo next, choose a deliberately scoped single-server deployment that preserves durable state, or budget for a proper shared database/authentication adaptation. Publish a live URL only after testing it. AWS, Google Cloud and other hosts are choices; a hosting logo does not substitute for customer value or technical evidence.
