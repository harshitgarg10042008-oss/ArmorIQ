# ArmorIQ Reference Findings

Source repository: https://github.com/iishap/armoriq-github-agent-docs

## Reference integration pattern

The shared GitHub agent guide describes an agent loop with four moves: plan, check, execute, report. It registers an MCP server before policy use, writes an allowlist policy with default-deny behavior, and routes tool calls through the ArmorIQ SDK. The guide says the result includes the arguments, decision, matched policy, and a `proofPath` tying execution to the signed plan.

The guide distinguishes local `sdk` mode, where the process holds the tool credential and executes tools, from `proxy` mode, where the call routes through ArmorIQ and the service does not touch the tool token. It also recommends using `hold` for write actions so a human can approve before execution.

## Risks from Discord screenshots

1. Agent registration may fail when a URL is required but the UI field is missing. We should validate that an agent/MCP endpoint URL is present in configuration and provide a clear preflight error before submitting registration.
2. Policy creation may return an internal server error. We should export the policy definition locally, validate required fields, and preserve a local SDK-shaped fallback so the demo can continue without claiming the policy was created remotely.
3. Approval may not appear if the platform cannot resolve tool metadata. We should validate tool names and metadata before invoking the approval path and expose the exact missing metadata in diagnostics.
4. Delegation may fail when financial metadata or amount is missing/too small. Any amount, currency, target, and tool metadata required by the official SDK must be explicit in the action payload.

## Current Pactline Phase 1 comparison

The local proof already follows plan → check → execute → report. It has explicit allowed actions, an unapproved recipient/data scope, a hold decision, human decision, audit output, and an empty outbox proving no email side effect occurred. It still needs an official SDK adapter/configuration path and preflight diagnostics for the external ArmorIQ platform.

## Safe implementation rule

Do not claim live ArmorIQ enforcement until a real SDK call, policy result, approval result, and proof path have been captured. Label the current local adapter as SDK-shaped or SDK-ready. Preserve the same plan/action/evidence schema so the official integration can replace the adapter without changing the frontend story.
