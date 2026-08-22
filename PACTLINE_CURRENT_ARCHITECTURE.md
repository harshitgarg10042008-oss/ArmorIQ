# Pactline Current Architecture and Integration Status

**Prepared for Team MindCrafter — ArmorIQ Theme, Problem 1: “Autonomous, until it shouldn’t be.”**

## Executive status

Pactline is no longer a static frontend prototype. The localhost dashboard calls a real backend, the backend runs the invoice lifecycle, and the backend’s execution path uses the official `@armoriq/sdk` package to capture an intent plan, obtain an intent token, and authorize each MCP action. The frontend does not call ArmorIQ directly; this is deliberate because the ArmorIQ API key must remain server-side.

The important qualification is that the runtime currently persists operational state in durable JSON files, not in the newly scaffolded Drizzle/MySQL tables. Therefore, the **frontend-to-backend-to-SDK-to-MCP vertical slice is implemented**, but the **database migration to the active runtime is still outstanding**. The final answer should not claim that Drizzle is already the source of truth.

## What is connected

| Layer | Current implementation | Status | Honest interpretation |
|---|---|---:|---|
| React dashboard | `client/src/pages/Home.tsx`, `Settings.tsx` | Connected | Calls backend endpoints and renders returned run, approval, audit, profile, notification, and settings state. |
| Frontend API client | `client/src/lib/pactline-api.ts` | Connected | Uses same-origin `/api/*` requests in local development and can use `VITE_PACTLINE_API_URL` when configured. |
| Local API bridge | `server/dev-api.mjs`, `server/_core/index.ts`, `scripts/dev.mjs` | Connected | Starts the API on port 8787 and the Vite UI on port 5173; Vite proxies API traffic. |
| Run lifecycle | `api/run.mjs` | Connected | Handles start, state read, approve, reject, and reset operations. |
| ArmorIQ SDK | `agent/armoriq-live-adapter.mjs` | Connected in server path | Creates `ArmorIQClient`, captures the invoice plan, obtains an intent token, and calls `client.invoke(...)` for every tool action. |
| MCP tool surface | `api/mcp.mjs` and `vercel-agent/api/mcp.mjs` | Implemented and registered for the configured MCP name | Exposes the invoice tools used by the ArmorIQ authorization path. The browser does not call MCP directly. |
| Durable runtime state | `api/pactline-store.mjs` | Connected, JSON-backed | Runs, approvals, settings, invoices, and evidence survive process restarts through runtime JSON storage. |
| Drizzle/MySQL | `drizzle/schema.ts` and server database scaffold | Not active in run path | The schema exists, but active run reads/writes still use the JSON store. |
| Remote health agent | root/Vercel `/api/agent` endpoint | Deployed and registered | Provides the safe external endpoint used for ArmorIQ registration/health evidence. It is separate from the full invoice run orchestrator. |

## End-to-end runtime flow

1. The operator opens `http://localhost:5173` and clicks **Run protected demo**.
2. `Home.tsx` sends `POST /api/run` with `{ operation: "start", invoiceId }`.
3. The Vite development proxy forwards that request to the local Pactline API on `127.0.0.1:8787`.
4. `api/run.mjs` validates the request, derives the operator context, and reads the invoice through the Pactline tool implementation.
5. `agent/armoriq-live-adapter.mjs` creates an `ArmorIQClient` from the server-only `ARMORIQ_API_KEY` and `USER_EMAIL` configuration.
6. The adapter captures a four-step plan: `read_invoice`, `extract_fields`, `write_record`, and `send_email`. It requests an ArmorIQ intent token containing the signed plan.
7. The backend invokes each tool through `client.invoke(mcpName, action, intentToken, args, ..., userEmail)`. This is the authorization boundary. The frontend cannot bypass it.
8. The first three actions are expected to remain inside the captured intent and are persisted as allowed actions when the configured ArmorIQ policy authorizes them.
9. The deliberately out-of-scope recipient is held by the authorization/MCP path before the side effect executes. The backend stores the held action and returns it to the frontend.
10. The operator clicks **Reject action** or **Approve & resume**. The browser sends a second `POST /api/run` decision request.
11. Reject appends an immutable rejection record and leaves the controlled outbox empty. Approve invokes the approved recipient through ArmorIQ again and only then permits the controlled test-outbox effect.
12. The frontend polls or refreshes `GET /api/run` and renders the backend-derived status, action trail, hold state, approval evidence, and outbox result.

## What the SDK does

ArmorIQ is not being used as a decorative label in the intended run path. The SDK is the server-side gate that binds a planned action sequence to an intent token and checks each subsequent MCP invocation against that authorization. The application code still orchestrates the workflow, reads the invoice, and presents the human decision UI. ArmorIQ decides whether a specific action is authorized to proceed under the captured intent and policy.

The API key is never supposed to be placed in React code or committed to GitHub. It is read only by the server adapter. If the key, user email, MCP name, or policy configuration is absent or invalid, the live execution path should fail safely rather than silently pretend that a live authorization occurred.

## What the MCP server does

The MCP layer is the tool interface, not the policy engine. Pactline exposes four invoice operations: reading invoice data, extracting fields, writing a ledger record, and sending an email. ArmorIQ’s SDK invocation path addresses the MCP by its configured name, `pactline-invoice`, and authorizes each action before the tool result is accepted.

The local browser does not directly call the MCP endpoint. That separation is correct for a production architecture: the browser talks to Pactline’s backend; the backend talks through ArmorIQ’s SDK; ArmorIQ reaches the registered MCP tool surface.

## What is real and what remains incomplete

| Capability | Status | Notes |
|---|---:|---|
| Backend-backed dashboard state | Real | `Home.tsx` loads state from `/api/run`; it does not own the run state as a static fixture. |
| Start, reject, approve, reset | Real | Each action is an API operation with validation and durable evidence. |
| ArmorIQ SDK calls | Real when server credentials/configuration are valid | The adapter imports `@armoriq/sdk` and calls the client methods in the active run path. |
| MCP tools | Real tool surface | The implementation includes invoice reads, ledger writes, and controlled test-mail behavior. |
| Human approval boundary | Real | Approval/rejection changes persisted run state and controls whether the approved test effect is written. |
| Run/audit/profile/settings persistence | Real but JSON-backed | Durable files are the current source of truth. |
| Drizzle/MySQL persistence | Not yet active | This is an enterprise-hardening task, not a prerequisite for demonstrating the vertical slice. |
| Public frontend deployment | Not the current demo baseline | The deployed API endpoint is verified; localhost is the reliable full control-center demo. |
| Fully live external email delivery | Intentionally not enabled | Approval writes to a controlled test outbox rather than sending a real external email. |

## Current GitHub state

The latest verified `main` commit in `harshitgarg10042008-oss/ArmorIQ` is `5a9025ffc889b3352729fce6966e4dcd100fd2b4`, titled **“Fix local API startup sequencing.”** It contains the Windows startup sequencing repair and optional analytics cleanup. The later localhost-origin fix is saved in the current project checkpoint as version `61d62a80`; it must also be synchronized to GitHub before the next Windows pull if the user has not already pulled that checkpoint’s commit.

## Bottom line

For the hackathon objective, the strongest accurate claim is: **Pactline is a backend-connected invoice agent whose active run path uses the ArmorIQ SDK to capture intent and authorize MCP tool calls, then pauses for human approval when an action leaves the signed boundary.** The system is not merely a hardcoded frontend. The remaining major production task is to replace the active JSON store with the scaffolded Drizzle/MySQL ownership model and then expand endpoint/UI integration tests.

For the demo, use the local control center with valid server-side ArmorIQ configuration. Show the four-step plan, the first three allowed actions, the ArmorIQ hold, reject or approve, and the resulting audit/outbox evidence. Do not claim that Drizzle is active or that a real external email was delivered.

## References

[1]: `agent/armoriq-live-adapter.mjs` — server-side ArmorIQ client, plan capture, token issuance, and authorized invocation.
[2]: `api/run.mjs` — run lifecycle, SDK execution path, human decisions, and audit persistence.
[3]: `api/mcp.mjs` and `vercel-agent/api/mcp.mjs` — MCP export and registered tool surface.
[4]: `client/src/lib/pactline-api.ts` — frontend-to-backend API contract.
[5]: `api/pactline-store.mjs` — current durable JSON runtime store.
[6]: `drizzle/schema.ts` — scaffolded database schema that is not yet the active run source of truth.
[7]: `https://github.com/harshitgarg10042008-oss/ArmorIQ/commit/5a9025ffc889b3352729fce6966e4dcd100fd2b4` — verified latest GitHub commit.
