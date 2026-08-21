# Live ArmorIQ Configuration Guide

Create a local `.env` file yourself when the ArmorIQ team gives you credentials. Never commit it to GitHub.

```dotenv
ARMORIQ_API_KEY=ak_replace_with_your_key
ARMORIQ_AGENT_URL=https://replace-with-your-agent-endpoint.example
ARMORIQ_POLICY_ID=replace-with-policy-id
ARMORIQ_MCP_NAME=pactline-invoice
USER_EMAIL=you@example.com
PACTLINE_TEST_RECIPIENT=external-review@protonmail.test
```

The Phase 1 preflight checks `ARMORIQ_API_KEY` and `USER_EMAIL` as required. It warns when the agent URL, policy ID, or MCP name is missing, because those missing values correspond to the registration and policy issues reported in Discord. The live adapter also expects `@armoriq/sdk` to be installed after the organizers confirm the supported package version.
