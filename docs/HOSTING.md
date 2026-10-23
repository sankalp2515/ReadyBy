# Hosting ReadyBy

The public judge beta is available at **https://34-10-147-168.sslip.io/**. The dedicated Google Cloud project is `readyby-2026-1023`. No CaseProof or IntentSeal resources were stopped or reconfigured.

## Current deployment

| Layer | Running configuration |
| --- | --- |
| Compute | Single on-demand `e2-small`, `readyby-web`, `us-central1-a` |
| Storage | 20 GiB persistent standard disk; SQLite under `/var/lib/readyby/readyby.sqlite` |
| Public ingress | HTTPS through Caddy; HTTP redirects to HTTPS; automatic certificate renewal |
| Application | Node 22.23.4, supervised `readyby.service`, non-root user, loopback port 4173 |
| Origin/authentication | Exact HTTPS origin and Host checks, secure session cookie, CSRF on writes, household scoping |
| MCP | Authenticated same-origin `/mcp`, real SDK Streamable HTTP, protocol 2025-11-25 |
| Text inference | Previously authorized Groq credential, Gemini fallback; actual provider/attempts recorded |
| Live speech | Authorized existing Gemini credential, server-minted one-use browser token |
| Backups | `readyby-backup.timer`, daily around 03:15 UTC; verified SQLite snapshots in `/var/backups/readyby` |
| Administration | SSH only through Google IAP's source range; no instance service account or broad cloud API scopes |

The IP-backed `sslip.io` hostname avoids needing a purchased domain. DNS and public certificate authorities remain external infrastructure dependencies. This deployment preserves the existing single-server transactional design; it is a judge beta, not a tested high-availability or high-traffic service.

## Spend and credentials

Planning allowance: **US$25/month**, with a **US$40 pre-tax reserve** for the expected review period. An independent **INR 2,000 monthly Google Cloud alert budget** filters only this ReadyBy project, with 50/80/100 percent notifications. Budget alerts do **not** stop this VM or create a dollar cap. Disk, IPv4, network transfer, provider usage, taxes and any prolonged hosting affect the total.

The VM and IPv4/disk baseline was estimated around US$17/month before usage/tax. Google bills the account in INR; actual conversion and invoice costs apply. The temporary existing Gemini key bills its original provider project, so those inference charges are **not included in the new project's alert filter**. ReadyBy's application-level monthly allowances limit voice/text requests; they are not a general account-wide spending limit.

A restricted Gemini key created for the new project could mint credentials but returned HTTP 402 for inference because AI Studio prepayment was required. The owner authorized using the existing key temporarily. To isolate provider billing later: fund Gemini in the ReadyBy project, create/use a ReadyBy-only key, install it in `/etc/readyby/environment`, verify text and audio requests, then restart ReadyBy. Never paste keys in a browser URL, commit them, or print the environment file in logs.

## Operations

All cloud commands must use the explicit ReadyBy project; changing the CLI's default project is unnecessary.

```powershell
gcloud compute ssh readyby-web --project=readyby-2026-1023 --zone=us-central1-a --tunnel-through-iap --command="sudo systemctl is-active readyby caddy readyby-backup.timer"
```

- Private server environment: `/etc/readyby/environment`, readable by root and the ReadyBy service group only.
- Built source/dependencies: `/opt/readyby`. Build the frontend before deploying; copy source/builds separately from secrets and household databases.
- For a planned update, run the backup service first, install the verified release, then restart only `readyby.service`. In-flight prepared calls/confirmations are intentionally lost and require fresh review.
- Check `/healthz`, a fresh guest's authenticated MCP flow, the configured inference providers, and an existing approved mission after restart.
- Backup snapshots include account/session material and household data. Keep them private. The verified daily backup is on the same persistent disk: it protects against some application mistakes, **not loss of that disk or region**. Off-disk encrypted backups, retention automation, disaster recovery, monitoring and load testing remain launch work.
- The optional Vosk recorded-transcript worker is not installed on this small hosted VM. Its controls are hidden when unavailable; live speech uses Gemini directly.

## Why this is a VM

Cloud Run's [container contract](https://docs.cloud.google.com/run/docs/container-contract) requires listening on `0.0.0.0` and the injected port. Its default writable filesystem is memory-backed and ephemeral. It must not hold ReadyBy's only household database. A Cloud Run move needs a durable storage adaptation plus a design for prepared calls/confirmation state across replicas. Cloud SQL is not a drop-in replacement for the current SQLite adapter.

The single VM keeps durable SQLite and the reviewed consent design intact at the accepted demonstration budget. Autoscaling and multi-region availability are not claimed.

## Hackathon scope

The [official rules](https://amazonappdev2026.devpost.com/rules) and [FAQ](https://amazonappdev2026.devpost.com/details/faqs) allow the Alexa+ web simulation path; AWS hosting is not required for this primary track. Hosting does not unlock native Alexa registration or qualify the project for the separate AWS Builder mini-challenge. Judges can use the authenticated MCP-backed web experience without setting up accounts or installing an MCP client; generic third-party MCP client login/OAuth is not implemented.
