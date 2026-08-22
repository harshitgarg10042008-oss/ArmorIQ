import { listAvailableInvoices, registerInvoice } from "./pactline-tools.mjs";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.PACTLINE_FRONTEND_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
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
