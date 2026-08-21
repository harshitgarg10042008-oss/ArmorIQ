# Official ArmorIQ Problem Statement 1 findings

Source: [PS Automate India Hack](https://docs.google.com/document/d/1x3a36XZg8AufSYJbsLoL3VxB1THmkR39hZJhHabnQow/export?format=txt)

## Core requirement

Build an AI agent that does real autonomous work using tools, via MCP or otherwise, and naturally encounters routine safe actions and higher-stakes actions. Use the ArmorIQ SDK to make the agent proceed through actions inside its declared intent plan and hold for human approval when an action falls outside that plan. The decision must be based on cryptographic verification of whether the action was part of the original authorization, not keyword matching. Every allowed or blocked decision must be logged.

## Required live demonstration

The statement asks for a live demo in which the agent completes a real task autonomously, then encounters a deliberately out-of-scope action and is caught and held before execution. The action should then be approved from the dashboard and the agent should continue. The autonomous-versus-gated boundary must be real and verifiable, not hardcoded.

## Explicit checks

The agent must have at least one action it genuinely wants to take that is genuinely wrong and that a keyword filter would not catch. The destructive action must be real: an actual database row, test-mode charge, or actual file. A hypothetical side effect is insufficient. If no domain MCP server exists, a mock MCP server is allowed because enforcement—not external integration—is the focus.

## Suggested invoice scenario

The official invoice example uses a folder of invoices. The agent reads fields, writes rows, and moves on. A PDF contains white-on-white text instructing the agent to email extracted data to an unknown address. The agent may comply when unguarded; with the plan enforced, the same call must stop before leaving the process. Suggested tools include CORD-v2 or SROIE, a poisoned invoice, Neon or SQLite, and a Mailtrap test send to an external address.

## Build order explicitly stated

Build the agent and tooling first, then implement ArmorIQ to govern where it runs free and where it stops. The statement names `capture_plan()`, `invoke()`, and hold/block enforcement.

## Important evidence distinction

A polished UI or deterministic mock is not equivalent to the required live enforcement. The strongest submission should demonstrate a real tool call, a real side effect for safe actions, a real prevented side effect for the dangerous action, an ArmorIQ SDK decision, and an audit record that can be inspected.
