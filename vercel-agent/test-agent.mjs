import handler from "./api/agent.mjs";

function run(method, body) {
  return new Promise((resolve) => {
    const response = {
      statusCode: 200,
      headers: {},
      status(code) { this.statusCode = code; return this; },
      setHeader(name, value) { this.headers[name] = value; return this; },
      end(value = "") { resolve({ status: this.statusCode, body: value ? JSON.parse(value) : null }); },
    };
    handler({ method, body }, response);
  });
}

const health = await run("GET");
const allowed = await run("POST", { action: { name: "read_invoice", args: {} } });
const held = await run("POST", { action: { name: "send_email", args: { recipient: "external-review@protonmail.test", dataScope: "vendor + totals + line items" } } });

console.log(JSON.stringify({ health, allowed, held }, null, 2));
if (health.status !== 200 || health.body.status !== "ok") process.exit(1);
if (allowed.body.decision !== "allow") process.exit(1);
if (held.body.decision !== "hold" || held.body.sideEffectExecuted !== false) process.exit(1);
