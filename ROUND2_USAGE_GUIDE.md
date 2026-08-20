# Pactline Round 2 Usage Guide

## Purpose

Pactline is a **Round 2 qualification MVP** for ArmorIQ Problem 1. It is intentionally not a full production invoice platform. The frontend is a polished control-center prototype that demonstrates the story judges need to understand: an agent completes routine work autonomously, ArmorIQ holds an action outside the captured intent, a human decides, and the audit trail proves what happened.

## Run locally

From the project directory, run:

```bash
pnpm dev
```

Open the local URL shown in the terminal. For a production verification run, use:

```bash
pnpm check
pnpm build
```

The project is frontend-only for this round. The current dashboard uses deterministic demo state so the team can record a reliable walkthrough while the real ArmorIQ SDK integration is being finalized from the official SDK meeting.

## Demo flow for the recording

Begin on the Overview page. The dashboard opens in the most important state: one invoice run is 75% complete and one `send_email` action is held because its recipient is outside the captured intent.

First, point out the headline: **“Autonomy is active. Authority is bounded.”** Explain that the agent has already completed three safe actions: reading the invoice, extracting fields, and writing the ledger record.

Next, point to the **Captured Intent** ribbon. Read it aloud: “Read invoice → normalize fields → write ledger record → notify approved recipient.” Explain that this is the boundary against which the proposed action is evaluated.

Then show the fourth tool call, `send_email`, with the unfamiliar recipient. Open the right-side **ArmorIQ Hold** decision card and explain that the action is held because it changes the recipient and data destination. The interface explicitly says this is an intent mismatch, not a keyword rule.

Click **Reject action** for the safest primary recording. The toast confirms that the unauthorized action did not execute. The card closes and the system returns to an awaiting state.

For a second take, refresh the page and click **Approve & resume**. The toast confirms that the agent resumed through ArmorIQ. Use this version only if your spoken explanation makes clear that approval is optional and the primary safety outcome is that no unapproved side effect occurs before the decision.

To show the autonomous path, click **Run protected demo**. The status changes briefly to “Agent is working,” and then returns to the held state. Use this to demonstrate that the agent run is active and that the boundary decision appears as the workflow reaches the fourth action.

## What is simulated and what is real

The current frontend is a **qualification interface and partial demo**. The visible states, tool calls, run ID, audit events, and approval transitions are deterministic UI state so the Round 2 walkthrough is reliable. The real ArmorIQ SDK wiring should replace the state transitions in the next build stage.

Do not claim in the presentation that this frontend alone has already executed a real external email or generated a real ArmorIQ proof path. Instead say: “This control center is the Round 2 proof-of-concept for the intended ArmorIQ enforcement flow; the final build will connect these states to the official SDK and live audit events.”

## What to show in the PPT

Use screenshots of the desktop dashboard for the architecture, active run, captured intent, held action, approval control, and audit trail slides. The mobile view is useful as evidence that the interface is responsive, but the primary demo should be recorded on desktop because the approval card and audit trail are visible at the same time.

## Demo narration

> “This is Pactline, an operator control center for bounded autonomous agents. The agent has processed an invoice without asking for permission at every step. It has read the document, extracted the fields, and written the ledger record. The next action would send the extracted data to a recipient that was never part of the original captured intent. ArmorIQ holds that action before execution. The operator can inspect the target, data scope, and reason, then reject or approve. The audit spine preserves the entire decision trail.”

## Recording checklist

Before recording, confirm that the browser is at the top of the page, the right-side hold card is visible, the browser zoom is 100%, and no personal tabs or credentials are shown. Record one clean desktop take with the pointer moving slowly across the captured intent, tool list, hold card, and audit trail. Keep the recording focused on the boundary decision rather than scrolling through every metric.

## Important limitation

This MVP is designed to help the team qualify for Round 2. It is not the final production implementation. The next stage should connect the official ArmorIQ SDK, replace deterministic UI state with real run events, add the actual invoice parser and sandbox email tool, and verify that the underlying unauthorized action is prevented before execution.
