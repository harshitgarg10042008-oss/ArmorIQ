/* Signal & Stewardship: the control center is a live operator surface; network state is explicit, auditable, and never silently invented. */
export type PactlineDecision = "allowed" | "held" | "approved" | "rejected" | "failed";
export type PactlineAction = {
  name: string;
  target: string;
  decision: PactlineDecision;
  reason: string;
  timestamp: string;
  latency: string;
  requiresHumanApproval?: boolean;
  result?: Record<string, unknown>;
};
export type PactlineInvoice = {
  invoiceId: string;
  vendor: string;
  amount: number;
  currency: string;
  date?: string;
  lineItems?: Array<Record<string, unknown>>;
  source?: string;
  fileName?: string;
  mimeType?: string;
  documentBase64?: string;
  sourceKey?: string;
  sourceUrl?: string;
};
export type PactlineRun = {
  runId: string;
  status: "held" | "approved" | "rejected" | "failed";
  invoice: { id: string; fileName: string; vendor: string; amount: number };
  plan: { id: string; goal: string; steps: Array<Record<string, unknown>>; status: string; mcpName: string };
  actions: PactlineAction[];
  audit: Array<PactlineAction & { event: string }>;
  outbox: Array<{ messageId?: string; recipient?: string; sentTo?: string; invoiceId: string; sentAt: string; transport?: string; executed?: boolean }>;
  createdAt: string;
  mode: string;
};
export type RunResponse = { currentRun: PactlineRun | null; runs: PactlineRun[]; evidence?: { ledger: unknown[]; outbox: unknown[] } };
type InvoiceResponse = { invoices: PactlineInvoice[] };
export type PactlineSettings = { workspaceName: string; workspaceDescription: string; approvalMode: string; defaultRecipient: string; retentionDays: number; updatedAt?: string };
export type PactlineProfile = { displayName: string; initials: string; avatarColor: "mint" | "cobalt" | "violet" | "amber"; updatedAt?: string };
export type PactlineNotificationPreferences = { approvalHolds: boolean; runFailures: boolean; weeklyDigest: boolean; updatedAt?: string };
export async function fetchSettings(): Promise<PactlineSettings> { const result = await request<{ settings: PactlineSettings }>("/api/settings"); return result.settings; }
export async function updateSettings(patch: Partial<PactlineSettings>): Promise<PactlineSettings> { const result = await request<{ settings: PactlineSettings }>("/api/settings", { method: "PUT", body: JSON.stringify(patch) }); return result.settings; }
export async function fetchProfile(): Promise<PactlineProfile> { const result = await request<{ profile: PactlineProfile }>("/api/profile"); return result.profile; }
export async function updateProfile(patch: Partial<PactlineProfile>): Promise<PactlineProfile> { const result = await request<{ profile: PactlineProfile }>("/api/profile", { method: "PUT", body: JSON.stringify(patch) }); return result.profile; }
export async function fetchNotificationPreferences(): Promise<PactlineNotificationPreferences> { const result = await request<{ preferences: PactlineNotificationPreferences }>("/api/notifications"); return result.preferences; }
export async function updateNotificationPreferences(patch: Partial<PactlineNotificationPreferences>): Promise<PactlineNotificationPreferences> { const result = await request<{ preferences: PactlineNotificationPreferences }>("/api/notifications", { method: "PUT", body: JSON.stringify(patch) }); return result.preferences; }
export async function downloadReport(kind: "audit" | "runs", format: "csv" | "pdf"): Promise<Blob> { const response = await fetch(`${API_URL}/api/export?kind=${kind}&format=${format}`); if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.error || `Export failed (${response.status})`); } return response.blob(); }
const API_URL = (import.meta.env.VITE_PACTLINE_API_URL || "").replace(/\/$/, "");
export class PactlineApiError extends Error {
  constructor(message: string, readonly statusCode: number, readonly status?: string, readonly requestId?: string) { super(message); this.name = "PactlineApiError"; }
}
function friendlyApiError(payload: any, statusCode: number) {
  if (payload?.status === "configuration-required") return "ArmorIQ is not configured on the server. Add the server-side ArmorIQ key and USER_EMAIL, then retry.";
  if (payload?.status === "authentication-required") return "ArmorIQ authentication was rejected. Verify the server-side key and retry.";
  if (payload?.status === "execution-failed") return `${payload.error || "ArmorIQ/MCP execution failed."}${payload.requestId ? ` (request ${payload.requestId})` : ""}`;
  return payload?.error || `Pactline API request failed (${statusCode})`;
}
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new PactlineApiError(friendlyApiError(payload, response.status), response.status, payload?.status, payload?.requestId);
  return payload as T;
}
export async function fetchRunState(): Promise<RunResponse> { return request<RunResponse>("/api/run"); }
export async function fetchInvoices(): Promise<InvoiceResponse> { return request<InvoiceResponse>("/api/invoices"); }
export async function registerInvoice(invoice: PactlineInvoice): Promise<PactlineInvoice> { const result = await request<{ invoice: PactlineInvoice }>("/api/invoices", { method: "POST", body: JSON.stringify(invoice) }); return result.invoice; }
export async function startPactlineRun(invoiceId?: string): Promise<PactlineRun> { return request<PactlineRun>("/api/run", { method: "POST", body: JSON.stringify({ operation: "start", invoiceId }) }); }
export async function submitPactlineDecision(decision: "approve" | "reject", comment?: string): Promise<PactlineRun> { return request<PactlineRun>("/api/run", { method: "POST", body: JSON.stringify({ operation: "decide", decision, comment, idempotencyKey: `${Date.now()}-${decision}` }) }); }
export async function resetPactlineRun(): Promise<RunResponse> { return request<RunResponse>("/api/run", { method: "POST", body: JSON.stringify({ operation: "reset" }) }); }
