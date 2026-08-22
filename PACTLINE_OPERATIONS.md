# Pactline Operations Runbook

Pactline now has two execution layers: the operator frontend and the server-side run/MCP handlers. The ArmorIQ API key and user identity remain server-side only. The browser receives sanitized run state, action decisions, and audit evidence; it never receives the intent token.

## Required server configuration

| Variable | Purpose | Required |
|---|---|---|
| `ARMORIQ_API_KEY` | ArmorIQ SDK authentication | Yes for live runs |
| `USER_EMAIL` | ArmorIQ end-user identity | Yes for live runs |
| `ARMORIQ_MCP_NAME` | Registered MCP server name | Recommended |
| `ARMORIQ_POLICY_ID` | Policy metadata used by the registered agent | Recommended |
| `ARMORIQ_AGENT_URL` | Registered ArmorIQ agent URL | Recommended |
| `PACTLINE_APPROVED_RECIPIENT` | Controlled recipient permitted after approval | Recommended |
| `PACTLINE_TEST_RECIPIENT` | Deliberately out-of-scope recipient for the hold test | Recommended |
| `PACTLINE_FRONTEND_ORIGIN` | Exact browser origin allowed by CORS | Required in production |
| `PACTLINE_OPERATOR_TOKEN` | Optional service/operator token for custom API clients | Recommended for non-OAuth clients |
| `PACTLINE_REQUIRE_AUTH` | Set to `true` to require a managed authenticated session for run and approval mutations | Recommended in production |
| `DATABASE_URL` | Managed database connection for the full-stack foundation | Required for database-backed features |

Never commit `.env`, tokens, or SDK output containing credentials.

## Local development

Run `pnpm install`, then `pnpm dev`. The Vite frontend runs on the managed preview port and the local API bridge runs on port `8787`. The local bridge also exposes OAuth and tRPC routes so the upgraded authentication layer can be used when the environment is configured.

Use `GET /api/health` to inspect sanitized configuration state. A `503` response with `configuration-required` means the process is healthy but live credentials are absent. It does not expose the credential values. A `401` response with `authentication-required` means the supplied ArmorIQ or operator credential was rejected. A `502` response with `execution-failed` means the SDK/MCP downstream call failed or timed out; it is a technical failure, not a human approval hold.

## Security boundary

All run mutations pass through the server. The approval endpoint accepts only `approve` or `reject`; it does not trust a browser-side authorization flag. When `PACTLINE_REQUIRE_AUTH=true`, the managed Manus session is authenticated server-side and only `admin` or `approver` users can decide a held action. An optional bearer token can protect custom clients.

The MCP endpoint validates JSON-RPC 2.0 requests, rejects unknown methods and tools, emits security headers, assigns request IDs, applies rate limiting, and allows a configured frontend origin instead of a wildcard in production.

## Data and recovery

The current prototype writes atomic runtime snapshots under `agent/runtime-data`. Invoice catalog, run, ledger, and outbox files are local runtime evidence and should not be committed. The managed database schema now contains organizations, workspaces, workspace members, invoices, runs, actions, approvals, and tamper-evident audit-event records for the next database-backed migration.

For production, route the run and MCP persistence through the managed database and object storage. Add backups, retention policies, tenant isolation, and an external queue before processing high-volume invoices.

## Verification checklist

1. Call `/api/health` and confirm the expected configuration status.
2. Call `/api/mcp` and confirm the four registered tools are advertised.
3. Confirm `ARMORIQ_API_KEY`, `USER_EMAIL`, the registered `ARMORIQ_MCP_NAME`, and the current deployed MCP endpoint are configured on the same server process.
4. Run a live invoice with the ArmorIQ SDK and capture a sanitized intent-token/decision proof.
5. Confirm safe tools execute and the out-of-scope email is held before its side effect.
6. Reject the hold and confirm the outbox remains unchanged.
7. Start a fresh run, approve the action, and confirm exactly one controlled outbox record.
8. Confirm the audit trail contains the actor, decision, reason, timestamps, and request correlation ID.
9. Check that no API key, token, email credential, or raw stack trace appears in browser responses or committed files.
