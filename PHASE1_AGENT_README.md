# Pactline Phase 1 Agent Proof

This folder contains a small runnable proof for ArmorIQ Problem 1. It demonstrates the required sequence: capture an authorization plan, execute safe actions autonomously, hold an out-of-scope action before its side effect, record a human decision, and write an audit file.

## Important status

The current script is an **SDK-shaped local adapter** for Round 2 preparation. It does not claim that the official ArmorIQ SDK is already connected. The functions named `capturePlan` and `invoke` are deliberately shaped so they can be replaced with the official SDK calls after the team receives credentials and confirms the SDK setup in the ArmorIQ meeting.

## Reference integration pattern

The shared ArmorIQ reference repository uses this sequence:

```text
plan → check → execute → report
```

Its live flow creates an `ArmorIQClient`, calls `bootstrap()`, creates a user session in `sdk` mode, calls `startPlan()`, checks each tool call, executes only allowed calls, reports the result, flushes observability, and closes the session. The optional `agent/armoriq-live-adapter.mjs` follows that same pattern. It is not loaded by the deterministic proof until `@armoriq/sdk` and official credentials are available.

## Preflight before using live ArmorIQ

Run this before registering an agent or creating a policy:

```bash
node agent/armoriq-preflight.mjs
```

It checks the required API key and user identity, validates an agent URL if supplied, confirms the MCP name and policy identifiers, and verifies that every tool has explicit target, data-scope, recipient, amount, and currency metadata. This is intended to prevent the Discord-reported URL, policy, approval, and delegation failures from appearing as unexplained server errors.

The preflight never prints secret values. Keep real credentials in a local `.env` file and never commit that file.

## Run

From the repository root:

```bash
node agent/pactline-agent.mjs
```

The script prints JSON events and creates:

- `agent/audit.json` — captured plan, decisions, executions, and human decision.
- `agent/outbox.json` — side effects that actually executed. It should remain `[]` for the default rejection path.

To demonstrate the approval branch:

```bash
PACTLINE_DECISION=approve node agent/pactline-agent.mjs
```

The current local proof records the approval decision but does not release the held email automatically. This keeps the default demo safe and makes the side-effect boundary explicit.

## Expected proof

The safe actions are `read_invoice`, `extract_fields`, and `write_record`. The proposed `send_email` action targets `external-review@protonmail.test` and requests `vendor + totals + line items`, while the captured plan only authorizes `finance@company.test` and `invoice metadata and totals`. The local adapter returns `hold`, sets `sideEffectExecuted` to `false`, and records the human decision.

## Next SDK integration

Install the official package only after the ArmorIQ team confirms the supported version and credentials:

```bash
npm install @armoriq/sdk
```

Then load the live adapter from `agent/armoriq-live-adapter.mjs`. The reference repository uses `ArmorIQClient({ apiKey })`, `bootstrap()`, `forUser(userEmail).startSession({ mode: "sdk", defaultMcpName, validitySeconds })`, `startPlan()`, `check()`, `report()`, `flushObservability()`, and `close()`.

Preserve the same tool names and evidence fields so the Pactline frontend can consume live events without changing its presentation. If registration, policy creation, approval, or delegation fails, save the exact error and use the preflight output to identify missing URL, policy, tool metadata, amount, currency, or MCP configuration before retrying.
