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
};

export type PactlineRun = {
  runId: string;
  status: "held" | "approved" | "rejected";
  invoice: { id: string; fileName: string; vendor: string; amount: number };
  plan: { id: string; goal: string; steps: string[]; status: string; mcpName: string };
  actions: PactlineAction[];
  audit: Array<PactlineAction & { event: string }>;
  outbox: Array<{ sentTo: string; invoiceId: string; sentAt: string; simulated: boolean }>;
  createdAt: string;
  mode: string;
};

type RunResponse = { currentRun: PactlineRun | null; runs: PactlineRun[] };

const API_URL = (import.meta.env.VITE_PACTLINE_API_URL || "https://pactline-agent.vercel.app").replace(/\/$/, "");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!response.ok) throw new Error(`Pactline API request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function fetchRunState(): Promise<RunResponse> {
  return request<RunResponse>("/api/run");
}

export async function startPactlineRun(): Promise<PactlineRun> {
  return request<PactlineRun>("/api/run", { method: "POST", body: JSON.stringify({ operation: "start" }) });
}

export async function submitPactlineDecision(decision: "approve" | "reject"): Promise<PactlineRun> {
  return request<PactlineRun>("/api/run", { method: "POST", body: JSON.stringify({ operation: "decide", decision }) });
}
