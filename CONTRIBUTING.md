# Contributing to ReadyBy

ReadyBy is a hosted and locally runnable beta focused on checked household deadline recovery. Start with the [README](README.md), [setup](docs/SETUP.md), [architecture](docs/architecture/README.md) and [MCP guide](docs/MCP.md).

## Development

Use Node 22.20+ and pnpm 11.25.0. Install with `pnpm install --frozen-lockfile`, then run `pnpm typecheck`, `pnpm test` and `pnpm build`. `pnpm dev` starts the frontend development server; the documented full application is `node app-server.mjs` after a build.

Automated tests use provider doubles. Do not require contributor credentials or paid APIs in CI. Live provider evaluations consume quota and must be run deliberately with your own server-side credentials. Do not overwrite recorded evidence without explaining the new run and its conditions.

## Propose a change

Open an issue describing the customer problem or reproducible defect. Keep pull requests focused; explain the before/after behavior and verification. Update docs when behavior, protocol, schema, configuration or demo expectations change. Include meaningful regression checks for domain behavior or authorization boundaries.

Preserve these invariants: elapsed time cannot complete a chore; reported facts survive recalculation; essential work cannot be casually deferred; changed commitments require exact review; model output cannot override authoritative scheduling or household scope. Label fixtures, simulation and recorded evidence honestly.

## Files that stay private

Never commit `.env`, API keys, cookies, recovery codes, household/account/session databases, backups, model weights or installed environments. Use synthetic fixtures in tests/issues. Optional audio examples must have permission and clear attribution. Report sensitive defects through [SECURITY.md](SECURITY.md).

Contributions are made under the repository's [MIT license](LICENSE). Only contribute material you have the right to license. Follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
