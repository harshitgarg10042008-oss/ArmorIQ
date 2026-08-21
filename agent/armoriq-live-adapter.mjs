/**
 * Optional live ArmorIQ adapter for Pactline.
 *
 * Based on the official reference pattern:
 * ArmorIQClient → bootstrap → forUser → startSession → startPlan → check →
 * execute tool only when allowed → report → flushObservability → close.
 *
 * This module is intentionally not imported by the deterministic proof until
 * @armoriq/sdk and credentials are installed/configured.
 */

export async function createPactlineSession() {
  let sdk;
  try {
    sdk = await import("@armoriq/sdk");
  } catch {
    throw new Error("@armoriq/sdk is not installed. Run npm install @armoriq/sdk after receiving official credentials.");
  }

  const apiKey = process.env.ARMORIQ_API_KEY;
  const userEmail = process.env.USER_EMAIL;
  if (!apiKey || !userEmail) {
    throw new Error("ARMORIQ_API_KEY and USER_EMAIL are required for the live ArmorIQ adapter.");
  }

  const client = new sdk.ArmorIQClient({ apiKey });
  await client.bootstrap();
  const session = client.forUser(userEmail).startSession({
    mode: "sdk",
    defaultMcpName: process.env.ARMORIQ_MCP_NAME || "pactline-invoice",
    validitySeconds: 2400,
  });

  return { client, session, userEmail };
}

export async function runAuthorizedStep(session, call, goal, executeTool) {
  await session.startPlan([call], goal);
  const decision = await session.check(call.name, call.args, process.env.USER_EMAIL);
  if (!decision.allowed) {
    await session.report(call.name, call.args, { status: decision.action, reason: decision.reason });
    return { decision: decision.action || "blocked", sideEffectExecuted: false, reason: decision.reason };
  }

  const result = await executeTool(call);
  await session.report(call.name, call.args, { status: "success", result });
  return { decision: "allowed", sideEffectExecuted: true, result };
}

export async function closePactlineSession(client, session) {
  await session.flushObservability();
  await session.close();
  return client;
}
