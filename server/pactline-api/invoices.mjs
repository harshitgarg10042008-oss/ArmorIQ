import { listAvailableInvoices, registerInvoice } from "./pactline-tools.mjs";
import { allowedOrigin, applySecurity, rateLimit } from "./security.mjs";

function cors(req, res) { applySecurity(req, res); }

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!allowedOrigin(req)) return res.status(403).json({ error: "Origin is not allowed" });
  if (!rateLimit(req, res)) return;
  try {
    if (req.method === "GET") return res.status(200).json({ invoices: await listAvailableInvoices() });
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Request body must be valid JSON" }); }
    }
    const invoice = await registerInvoice(body || {});
    return res.status(201).json({ invoice });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Invoice input rejected" });
  }
}
