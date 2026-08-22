/* Signal & Stewardship: the control center is a live operator surface; network state is explicit, auditable, and never silently invented. */
export type PactlineDecision = "allowed" | "held" | "approved" | "rejected";
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
};
export type PactlineRun = {
  runId: string;
  status: "held" | "approved" | "rejected";
  invoice: { id: string; fileName: string; vendor: string; amount: number };
  plan: { id: string; goal: string; steps: Array<Record<string, unknown>>; status: string; mcpName: string };
  actions: PactlineAction[];
  audit: Array<PactlineAction & { event: string }>;
  outbox: Array<{ messageId?: string; recipient?: string; sentTo?: string; invoiceId: string; sentAt: string; transport?: string; executed?: boolean }>;
  createdAt: string;
  mode: string;
};
type RunResponse = { currentRun: PactlineRun | null; runs: PactlineRun[]; evidence?: { ledger: unknown[]; outbox: unknown[] } };
type InvoiceResponse = { invoices: PactlineInvoice[] };
export type PactlineSettings = { workspaceName: string; workspaceDescription: string; approvalMode: string; defaultRecipient: string; retentionDays: number; updatedAt?: string };
export async function fetchSettings(): Promise<PactlineSettings> { const result = await request<{ settings: PactlineSettings }>("/api/settings"); return result.settings; }
export async function updateSettings(patch: Partial<PactlineSettings>): Promise<PactlineSettings> { const result = await request<{ settings: PactlineSettings }>("/api/settings", { method: "PUT", body: JSON.stringify(patch) }); return result.settings; }
const API_URL = (import.meta.env.VITE_PACTLINE_API_URL || "").replace(/\/$/, "");
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Pactline API request failed (${response.status})`);
  return payload as T;
}
export async function fetchRunState(): Promise<RunResponse> { return request<RunResponse>("/api/run"); }
export async function fetchInvoices(): Promise<InvoiceResponse> { return request<InvoiceResponse>("/api/invoices"); }
export async function registerInvoice(invoice: PactlineInvoice): Promise<PactlineInvoice> { const result = await request<{ invoice: PactlineInvoice }>("/api/invoices", { method: "POST", body: JSON.stringify(invoice) }); return result.invoice; }
export async function startPactlineRun(invoiceId?: string): Promise<PactlineRun> { return request<PactlineRun>("/api/run", { method: "POST", body: JSON.stringify({ operation: "start", invoiceId }) }); }
export async function submitPactlineDecision(decision: "approve" | "reject", comment?: string): Promise<PactlineRun> { return request<PactlineRun>("/api/run", { method: "POST", body: JSON.stringify({ operation: "decide", decision, comment, idempotencyKey: `${Date.now()}-${decision}` }) }); }
export async function resetPactlineRun(): Promise<RunResponse> { return request<RunResponse>("/api/run", { method: "POST", body: JSON.stringify({ operation: "reset" }) }); }
