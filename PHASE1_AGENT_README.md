# Pactline Phase 1 Agent Proof

This folder contains a small runnable proof for ArmorIQ Problem 1. It demonstrates the required sequence: capture an authorization plan, execute safe actions autonomously, hold an out-of-scope action before its side effect, record a human decision, and write an audit file.

## Important status

The current script is an **SDK-shaped local adapter** for Round 2 preparation. It does not claim that the official ArmorIQ SDK is already connected. The functions named `capturePlan` and `invoke` are deliberately shaped so they can be replaced with the official SDK calls after the team receives credentials and confirms the SDK setup in the ArmorIQ meeting.

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

Replace `capturePlan` with ArmorIQ `capture_plan()` and replace the authorization path inside `invoke` with ArmorIQ `invoke()` or the exact official SDK equivalent. Preserve the same tool names and evidence fields so the Pactline frontend can consume live events without changing its presentation.
