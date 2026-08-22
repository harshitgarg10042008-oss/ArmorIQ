import { randomUUID } from "node:crypto";

const buckets = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

export function applySecurity(req, res) {
  const requestId = req.headers?.["x-request-id"] || `req_${randomUUID().slice(0, 8)}`;
  res.setHeader("X-Request-ID", requestId);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  const configuredOrigin = process.env.PACTLINE_FRONTEND_ORIGIN;
  const requestOrigin = req.headers?.origin;
  if (configuredOrigin && requestOrigin === configuredOrigin) {
    res.setHeader("Access-Control-Allow-Origin", configuredOrigin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key, X-Request-ID");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return requestId;
}

export function rateLimit(req, res, limit = MAX_REQUESTS) {
  const forwarded = req.headers?.["x-forwarded-for"];
  const key = String(forwarded || req.socket?.remoteAddress || "local").split(",")[0];
  const now = Date.now();
  const previous = buckets.get(key);
  const entry = !previous || now - previous.startedAt > WINDOW_MS ? { startedAt: now, count: 0 } : previous;
  entry.count += 1;
  buckets.set(key, entry);
  if (entry.count <= limit) return true;
  res.status(429).json({ error: "Too many requests", retryAfterSeconds: Math.ceil((WINDOW_MS - (now - entry.startedAt)) / 1000) });
  return false;
}

export function allowedOrigin(req) {
  const configuredOrigin = process.env.PACTLINE_FRONTEND_ORIGIN;
  const requestOrigin = req.headers?.origin;
  if (!requestOrigin) return true;
  return Boolean(configuredOrigin && requestOrigin === configuredOrigin);
}

export function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function validateRunRequest(body) {
  if (!isPlainObject(body)) return "JSON object required";
  if (body.operation === "start") {
    if (body.invoiceId !== undefined && (typeof body.invoiceId !== "string" || !/^INV-[A-Z0-9-]+$/i.test(body.invoiceId))) return "invoiceId must look like INV-044";
    return null;
  }
  if (body.operation === "decide") {
    if (!["approve", "reject"].includes(body.decision)) return "decision must be approve or reject";
    if (body.comment !== undefined && (typeof body.comment !== "string" || body.comment.length > 1000)) return "comment must be at most 1000 characters";
    if (body.idempotencyKey !== undefined && (typeof body.idempotencyKey !== "string" || body.idempotencyKey.length < 8 || body.idempotencyKey.length > 128)) return "idempotencyKey must be 8–128 characters";
    return null;
  }
  if (body.operation === "reset") return null;
  return "Expected operation=start, operation=decide, or operation=reset";
}

export function validateToolArguments(name, args = {}) {
  if (!isPlainObject(args)) return "Tool arguments must be an object";
  if (["read_invoice", "extract_fields"].includes(name) && (typeof args.invoiceId !== "string" || !/^INV-[A-Z0-9-]+$/i.test(args.invoiceId))) return "invoiceId is required";
  if (name === "write_record" && (typeof args.invoiceId !== "string" || typeof args.vendor !== "string" || !Number.isFinite(Number(args.amount)))) return "invoiceId, vendor, and numeric amount are required";
  if (name === "send_email" && (typeof args.recipient !== "string" || !args.recipient.includes("@") || typeof args.invoiceId !== "string")) return "recipient and invoiceId are required";
  return null;
}
