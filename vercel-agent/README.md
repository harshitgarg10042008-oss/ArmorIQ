# Pactline Agent Endpoint

This is the minimal stateless HTTPS endpoint for ArmorIQ registration. It is separate from the Pactline frontend.

## Local test

From this directory:

```bash
npm install
node --input-type=module -e "import('./api/agent.mjs').then(() => console.log('module loaded'))"
```

The endpoint is designed for Vercel Functions. `GET /api/agent` returns a health/configuration response. `POST /api/agent` accepts an action and returns an allow, hold, or block decision.

Example POST body:

```json
{
  "planId": "plan_pactline_invoice_v1",
  "action": {
    "name": "send_email",
    "args": {
      "recipient": "external-review@protonmail.test",
      "dataScope": "vendor + totals + line items"
    }
  }
}
```

## Deploy with Vercel

In Vercel, import the GitHub repository and set the **Root Directory** to `vercel-agent`. Add these environment variables in Project Settings → Environment Variables:

```text
ARMORIQ_API_KEY       = your private ArmorIQ key
USER_EMAIL            = your ArmorIQ user identity
ARMORIQ_POLICY_ID     = your policy ID, after policy creation
ARMORIQ_MCP_NAME      = pactline-invoice
ARMORIQ_LIVE          = false
PACTLINE_APPROVED_RECIPIENT = finance@company.test
```

Do not commit `.env` or paste secrets into GitHub, Discord, screenshots, or video recordings. Deploy first with `ARMORIQ_LIVE=false` so the public endpoint can be tested safely. The live SDK adapter should be enabled only after the organizers confirm the exact SDK session and policy setup.

After deployment, test:

```text
https://YOUR-VERCEL-DOMAIN.vercel.app/api/agent
```

The response should contain `"status": "ok"`. Use this public HTTPS URL in ArmorIQ → Inventory → Agents → Add AI agent → Connect by URL.
