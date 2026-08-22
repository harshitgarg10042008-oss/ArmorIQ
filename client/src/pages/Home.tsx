/* Signal & Stewardship: evidence before decoration, asymmetric command layout, ink + warm paper + Signal Green, exact operator-first copy. */
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { fetchInvoices, fetchRunState, registerInvoice, resetPactlineRun, startPactlineRun, submitPactlineDecision, type PactlineInvoice, type PactlineRun } from "@/lib/pactline-api";
import {
  ArrowUpRight,
  BadgeCheck,
  Moon,
  Sun,
  Bell,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  Code2,
  FileCheck2,
  FileText,
  Fingerprint,
  FolderOpen,
  Gauge,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  Network,
  Play,
  Radio,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  TimerReset,
  UserRound,
  X,
  Zap,
} from "lucide-react";

const events = [
  { time: "14:32:08", label: "Invoice parsed", detail: "northstar_invoice_044.pdf", state: "allowed", icon: FileCheck2 },
  { time: "14:32:09", label: "Fields normalized", detail: "12 fields · confidence 0.98", state: "allowed", icon: Sparkles },
  { time: "14:32:10", label: "Record written", detail: "ledger.invoices / INV-044", state: "allowed", icon: Code2 },
  { time: "14:32:11", label: "Outbound email proposed", detail: "recipient not in captured plan", state: "held", icon: Send },
];

const toolCalls: never[] = [];

function PageView({ page, darkMode, notify, liveRun, history, onApprove, onReject }: { page: string; darkMode: boolean; notify: (message: string) => void; liveRun: PactlineRun | null; history: PactlineRun[]; onApprove: () => void; onReject: () => void }) {
  const pageData: Record<string, { eyebrow: string; title: string; description: string }> = {
    "Live runs": { eyebrow: "OBSERVABILITY / 02", title: "Live runs", description: "See autonomous work move through its authorization boundary in real time." },
    "Approval queue": { eyebrow: "OPERATOR CONTROL / 03", title: "Approval queue", description: "Only the decisions that change authority wait for a human." },
    "Audit trail": { eyebrow: "PROOF SYSTEM / 04", title: "Audit trail", description: "Every tool call carries its decision, target, and proof context." },
    "Intent plans": { eyebrow: "AUTHORITY / 05", title: "Intent plans", description: "Define what your agents can do before they start doing it." },
  };
  const data = pageData[page] ?? pageData["Live runs"];
  const isQueue = page === "Approval queue";
  const heldAction = liveRun?.actions.find((action) => action.decision === "held");
  const queueCount = heldAction ? "01 pending" : "0 pending";
  const streamEvents = liveRun?.audit?.map((event: any, index: number) => ({ time: event.timestamp ? new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : `event-${index + 1}`, label: event.event || event.name || "Authorization event", detail: event.reason || event.target || "Backend audit event", state: event.decision === "held" ? "held" : event.decision === "rejected" ? "rejected" : "allowed", icon: event.decision === "held" ? CircleAlert : event.event?.includes("intent") ? LockKeyhole : FileCheck2 })) || [];
  return <section className={`subpage ${darkMode ? "subpage-dark" : ""}`}>
    <div className="subpage-hero"><div><div className="eyebrow"><span className="eyebrow-line" />{data.eyebrow}</div><h1>{data.title}</h1><p>{data.description}</p></div><div className="subpage-orbit"><div className="orbit-core"><ShieldCheck size={26} /></div><span className="orbit-dot one" /><span className="orbit-dot two" /><span className="orbit-dot three" /></div></div>
    <div className="subpage-grid">
      <div className="subpage-panel wide"><div className="panel-header"><div><div className="micro-label">{isQueue ? "PENDING DECISION" : "SYSTEM STREAM"}</div><h2>{isQueue ? "Recipient outside plan" : "Authorization events"}</h2></div><span className={`page-badge ${isQueue ? "amber" : "blue"}`}>{isQueue ? queueCount : liveRun ? "Live" : "Waiting"}</span></div>
        {isQueue ? <><div className="queue-summary"><div className="risk-mark"><CircleAlert size={19} /></div><div><strong>{heldAction?.name || "No pending action"}</strong><span>{heldAction?.target || "Run the protected workflow to populate this queue"}</span></div><div className="queue-time">{heldAction ? "Held for review" : "No pending decision"}</div></div><div className="queue-copy">{heldAction ? "The agent proposed an action outside the captured intent. ArmorIQ has paused execution before the side effect." : "The approval queue is clear. Start a protected run to surface a decision."}</div><div className="decision-actions"><button className="reject-button" onClick={onReject} disabled={!heldAction}>Reject action</button><button className="approve-button" onClick={onApprove} disabled={!heldAction}><BadgeCheck size={15} /> Approve & resume</button></div></> : <div className="stream-list">{(streamEvents.length ? streamEvents : [{ time: "—", label: "No audit events loaded", detail: "Start a protected run to populate the backend audit trail", state: "allowed", icon: ShieldCheck }]).map((event, index) => { const Icon = event.icon; return <div className="stream-row" key={`${event.time}-${index}`}><div className={`stream-icon ${event.state}`}><Icon size={15} /></div><div><strong>{event.label}</strong><span>{event.detail}</span></div><time>{event.time}</time><span className={`page-badge ${event.state === "held" ? "amber" : "green"}`}>{event.state}</span></div>; })}</div>}
      </div>
      {page === "Live runs" && <div className="subpage-panel wide"><div className="panel-header"><div><div className="micro-label">PERSISTED HISTORY</div><h2>Recent runs</h2></div><span className="page-badge blue">{history.length} recorded</span></div>{history.length ? <div className="stream-list">{history.slice(0, 8).map((run) => <div className="stream-row" key={run.runId}><div className={`stream-icon ${run.status === "rejected" ? "held" : "allowed"}`}><FileText size={15} /></div><div><strong>{run.runId}</strong><span>{run.invoice.vendor} · {run.invoice.id}</span></div><time>{new Date(run.createdAt).toLocaleDateString()}</time><span className="page-badge green">{run.status}</span></div>)}</div> : <div className="empty-state">No persisted runs yet. Start a protected run to create one.</div>}</div>}
      <div className="subpage-panel"><div className="panel-header"><div><div className="micro-label">CURRENT CONTEXT</div><h2>Intent plan</h2></div><LockKeyhole size={17} className="panel-icon" /></div><div className="plan-card"><div className="plan-card-top"><BadgeCheck size={15} /><span>{liveRun?.plan.status || "Awaiting plan capture"}</span></div><strong>{liveRun?.plan.goal || "Invoice handling plan"}</strong><p>{liveRun ? liveRun.plan.steps.map((step: any) => step.action || step.name || String(step)).join(" → ") : "Start a protected run to capture a task-specific authorization plan."}</p><div className="plan-meta"><span>{liveRun?.plan.id || "Awaiting plan capture"}</span><span>{liveRun ? new Date(liveRun.createdAt).toLocaleTimeString() : "—"}</span></div></div><button className="outline-action" onClick={() => notify(liveRun ? `Intent ${liveRun.plan.id} loaded from the backend` : "Start a run to inspect captured authorization")} disabled={!liveRun}>Inspect authorization <ArrowUpRight size={14} /></button></div>
    </div>
  </section>;
}

export default function Home() {
  const { user } = useAuth();
  // The useAuth hook provides authenticated workspace identity when available.
  // To implement login/logout, call logout(), or start login from an event
  // handler: onClick={() => startLogin()} (imported from "@/const"). Never call
  // startLogin() during render (no href={startLogin()}) — it mints a one-time
  // nonce cookie and must run only at the moment of navigation.
  const [activeNav, setActiveNav] = useState(() => new URLSearchParams(window.location.search).get("page") || "Overview");
  const [runState, setRunState] = useState<"idle" | "running" | "held" | "approved" | "rejected">("idle");
  const [liveRun, setLiveRun] = useState<PactlineRun | null>(null);
  const [runHistory, setRunHistory] = useState<PactlineRun[]>([]);
  const [availableInvoices, setAvailableInvoices] = useState<PactlineInvoice[]>([]);
  const [invoiceId, setInvoiceId] = useState("INV-044");
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<"start" | "approve" | "reject" | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [toast, setToast] = useState("");
  const [darkMode, setDarkMode] = useState(() => new URLSearchParams(window.location.search).get("theme") === "dark" || window.localStorage.getItem("intentfence-theme") === "dark");

  const loadRunState = async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const data = await fetchRunState();
      setRunHistory(data.runs || []);
      if (data.currentRun) { setLiveRun(data.currentRun); setRunState(data.currentRun.status === "held" ? "held" : data.currentRun.status); setShowDrawer(data.currentRun.status === "held" ); }
    } catch {
      setApiError("Could not reach the Pactline backend. Check the API and retry.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRunState();
    void fetchInvoices().then(({ invoices }) => {
      setAvailableInvoices(invoices);
      if (invoices[0]?.invoiceId) setInvoiceId((current) => current || invoices[0].invoiceId);
    }).catch(() => setApiError("Could not load the invoice catalog. You can still enter an invoice ID."));
  }, []);

  const stateCopy = useMemo(() => {
    if (runState === "approved") return { label: "Action approved", sub: "Run resumed · live API", tone: "green" };
    if (runState === "rejected") return { label: "Action rejected", sub: "Unauthorized action cancelled", tone: "muted" };
    if (runState === "running") return { label: "Agent is working", sub: "Evaluating tool call 04 of 04", tone: "blue" };
    if (runState === "idle") return { label: "Awaiting a run", sub: "Drop an invoice to begin", tone: "muted" };
    return { label: "Human decision required", sub: "1 action held by ArmorIQ", tone: "amber" };
  }, [runState]);

  const toggleDarkMode = () => {
    setDarkMode((current) => {
      const next = !current;
      window.localStorage.setItem("intentfence-theme", next ? "dark" : "light");
      return next;
    });
    notify(darkMode ? "Light mode enabled" : "Dark mode enabled");
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const handleInvoiceFile = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const invoice = JSON.parse(await file.text()) as PactlineInvoice;
      const saved = await registerInvoice({ ...invoice, source: file.name });
      setAvailableInvoices((current) => [saved, ...current.filter((item) => item.invoiceId !== saved.invoiceId)]);
      setInvoiceId(saved.invoiceId);
      notify(`Invoice ${saved.invoiceId} added to the catalog`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Invoice JSON could not be imported.");
    } finally {
      event.target.value = "";
    }
  };

  const simulateRun = async () => {
    setRunState("running");
    setPendingAction("start");
    setApiError("");
    notify("Intent captured · starting live run");
    try {
      const nextRun = await startPactlineRun(invoiceId.trim() || undefined);
      setLiveRun(nextRun);
      setRunHistory((current) => [nextRun, ...current.filter((run) => run.runId !== nextRun.runId)]);
      setRunState(nextRun.status);
      setShowDrawer(true);
    } catch {
      setApiError("Could not start the run. Please retry.");
      setRunState("idle");
      notify("Run could not start · please retry");
    } finally {
      setPendingAction(null);
    }
  };

  const approve = async () => {
    setPendingAction("approve");
    setApiError("");
    try { const nextRun = await submitPactlineDecision("approve"); setLiveRun(nextRun); setRunState("approved"); setShowDrawer(false); notify("Approved · run updated by API"); }
    catch { setApiError("Approval could not be submitted. Please retry."); }
    finally { setPendingAction(null); }
  };

  const resetRun = async () => {
    setPendingAction("start");
    setApiError("");
    try {
      await resetPactlineRun();
      setLiveRun(null);
      setRunState("idle");
      setShowDrawer(false);
      notify("Active run cleared · history preserved");
    } catch { setApiError("The active run could not be cleared. Please retry."); }
    finally { setPendingAction(null); }
  };

  const reject = async () => {
    setPendingAction("reject");
    setApiError("");
    try { const nextRun = await submitPactlineDecision("reject"); setLiveRun(nextRun); setRunState("rejected"); setShowDrawer(false); notify("Rejected · unauthorized action did not execute"); }
    catch { setApiError("Rejection could not be submitted. Please retry."); }
    finally { setPendingAction(null); }
  };

  const displayedToolCalls = liveRun?.actions || [];
  const completedActionCount = liveRun?.actions.filter((action) => action.decision === "allowed" || action.decision === "approved").length || 0;
  const totalActionCount = liveRun?.actions.length || 4;
  const progressPercent = liveRun ? Math.round((completedActionCount / totalActionCount) * 100) : 0;
  const heldAction = liveRun?.actions.find((action) => action.decision === "held");

  return (
    <div className={`app-shell ${darkMode ? "dark-mode" : ""}`}>
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark-wrap" aria-label="Pactline mark"><svg viewBox="0 0 40 40" role="img" aria-hidden="true"><rect width="40" height="40" rx="10" fill="#57e1c1"/><path d="M12 10h16v7h-9v4h7v6H19v3h-7V10Z" fill="#0f1715"/><path d="M12 30h7v-3h7v-6h-7v-4h9v-7" fill="none" stroke="#0f1715" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
          <div><div className="brand-name">pact<span>line</span></div><div className="brand-sub">operator control</div></div>
        </div>
        <button className="workspace-switch" onClick={() => notify("Finance Ops is the active protected workspace")}><div className="workspace-avatar">PL</div><div><div className="workspace-name">Finance Ops</div><div className="workspace-meta">Protected workspace</div></div><ChevronDown size={14} /></button>
        <nav className="nav-stack" aria-label="Primary navigation">
          {[
            ["Overview", LayoutDashboard],
            ["Live runs", Radio],
            ["Approval queue", Inbox],
            ["Audit trail", Fingerprint],
            ["Intent plans", LockKeyhole],
          ].map(([label, Icon]: any) => (
            <button key={label} onClick={() => { setActiveNav(label); notify(`${label} view selected`); }} className={`nav-item ${activeNav === label ? "active" : ""}`}>
              <Icon size={16} strokeWidth={activeNav === label ? 2.4 : 1.8} /><span>{label}</span>{label === "Approval queue" && liveRun?.actions.some((action) => action.decision === "held") && <span className="nav-count">01</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="system-note"><div className="status-dot live" /><div><div className="micro-label">ArmorIQ link</div><div className="system-state">{liveRun ? "Connected · API" : "Waiting · API"}</div></div></div>
          <button className="nav-item" onClick={() => window.location.assign("/settings")}><KeyRound size={16} /><span>Workspace settings</span></button>
          <div className="user-card"><div className="user-avatar"><UserRound size={16} /></div><div><div className="workspace-name">{user?.name || "Operator"}</div><div className="workspace-meta">{user?.role === "admin" ? "Owner · admin" : "Workspace member"}</div></div><MoreHorizontal size={16} /></div>
        </div>
      </aside>

      <main className="main-canvas">
        {isLoading && <div className="loading-bar" role="status" aria-live="polite"><span className="loading-bar-fill" /><span>Syncing live run state…</span></div>}
        {apiError && <div className="api-error" role="alert"><CircleAlert size={15} /><span>{apiError}</span><button onClick={() => void loadRunState()} disabled={isLoading}>{isLoading ? "Retrying…" : "Retry"}</button></div>}
        <header className="topbar">
          <div className="breadcrumbs"><span>Finance Ops</span><ChevronRight size={14} /><strong>Control center</strong></div>
          <div className="top-actions"><button className="search-box" onClick={() => notify("Search is available after a live run is loaded")}><Search size={15} /><span>Search runs, invoices…</span><kbd>⌘ K</kbd></button><button className="icon-button theme-toggle" aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} onClick={toggleDarkMode}>{darkMode ? <Sun size={17} /> : <Moon size={17} />}</button><button className="icon-button" aria-label="Notifications" onClick={() => notify("No new notifications")}><Bell size={17} /><span className="notification-dot" /></button><button className="mobile-menu" aria-label="Open menu" onClick={() => notify("Use the sidebar navigation on this screen")}><Menu size={18} /></button></div>
        </header>

        {activeNav !== "Overview" ? <PageView page={activeNav} darkMode={darkMode} notify={notify} liveRun={liveRun} history={runHistory} onApprove={approve} onReject={reject} /> : <>
        <section className="hero-band">
          <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" />AUTONOMOUS OPERATIONS / 01</div><h1>Autonomy is active.<br /><em>Authority is bounded.</em></h1><p>Pactline lets your agent move through routine invoice work while ArmorIQ holds the exact moment an action leaves its captured intent.</p><div className="invoice-input-row"><label className="invoice-input-label">INVOICE ID<input className="invoice-input" list="pactline-invoice-list" value={invoiceId} onChange={(event) => setInvoiceId(event.target.value)} placeholder="INV-044" /><datalist id="pactline-invoice-list">{availableInvoices.map((invoice) => <option key={invoice.invoiceId} value={invoice.invoiceId}>{invoice.vendor}</option>)}</datalist></label><label className="invoice-upload-button">IMPORT JSON<input type="file" accept="application/json,.json" onChange={handleInvoiceFile} /></label></div><div className="hero-actions"><button className="primary-button" onClick={() => void simulateRun()} disabled={pendingAction === "start" || isLoading}>{pendingAction === "start" ? <><TimerReset size={15} className="spin" /> Starting…</> : <><Play size={15} fill="currentColor" /> Run protected demo <ArrowUpRight size={15} /></>}</button><button className="text-button" onClick={() => { setActiveNav("Intent plans"); notify("Intent plans view selected"); }}>View architecture <ChevronRight size={15} /></button>{liveRun && <button className="text-button" onClick={() => void resetRun()} disabled={pendingAction !== null}><TimerReset size={15} /> New run</button>}</div></div>
          <div className="hero-visual"><div className="hero-signal-texture" role="img" aria-label="Abstract authorization signal texture" /><div className="hero-visual-overlay"><div className="signal-ring"><ShieldCheck size={31} /></div><div><div className="micro-label">CURRENT BOUNDARY</div><div className="hero-visual-title">Invoice handling plan</div><div className="hero-visual-meta"><span className="status-dot live" />{isLoading ? "Connecting to Pactline API…" : liveRun ? `${liveRun.plan.status} · ${liveRun.mode}` : "No active run"}</div></div></div></div>
        </section>

        <section className="status-strip"><div className="status-primary"><div className={`status-pulse ${stateCopy.tone}`}><span /></div><div><div className="micro-label">RUN STATUS</div><div className="status-title">{stateCopy.label}</div></div><div className="status-divider" /><div><div className="micro-label">RUN ID</div><div className="status-code">{liveRun?.runId || "run_pending"}</div></div></div><div className="status-metrics"><div><div className="micro-label">ALLOWED IN RUN</div><strong>{completedActionCount}</strong></div><div><div className="micro-label">PENDING REVIEW</div><strong className="amber-text">{heldAction ? 1 : 0}</strong></div><div><div className="micro-label">API MODE</div><strong className="mode-value">{liveRun?.mode === "safe-simulation" ? "SIM" : liveRun ? "LIVE" : "—"}</strong></div></div></section>

        <section className="content-grid">
          <div className="primary-column">
            <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" />ACTIVE RUN</div><h2>{liveRun ? `Invoice #${liveRun.invoice.id.replace("INV-", "")}` : "No active invoice"} {liveRun && <span className={`inline-status ${liveRun.status === "held" ? "amber" : liveRun.status === "rejected" ? "held" : "green"}`}>{liveRun.status === "held" ? "Human decision required" : liveRun.status === "approved" ? "Run approved" : "Action rejected"}</span>}</h2></div><button className="ghost-button" onClick={() => liveRun ? setShowDrawer(true) : notify("Start a protected run first")}>Open run details <ArrowUpRight size={14} /></button></div>
            <div className="run-card"><div className="run-card-top"><div className="file-badge"><FileText size={18} /></div><div className="file-info"><strong>{liveRun?.invoice.fileName || "Waiting for an invoice run"}</strong><span>{liveRun ? `${liveRun.invoice.vendor} · source: inbox` : "Start a run to load invoice data"}</span></div><div className="run-progress"><div className="progress-label"><span>{completedActionCount} of {totalActionCount} actions complete</span><span>{progressPercent}%</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div></div><button className="icon-button quiet" onClick={() => notify(liveRun ? "Run actions are available in Live runs" : "Start a protected run to create run actions")}><MoreHorizontal size={17} /></button></div><div className="intent-ribbon"><div className="ribbon-icon"><LockKeyhole size={14} /></div><div><div className="micro-label">CAPTURED INTENT</div><div className="intent-copy">Read invoice → normalize fields → write ledger record → notify approved recipient</div></div><div className="ribbon-proof"><BadgeCheck size={15} /><span>{liveRun?.plan.id || "Awaiting plan capture"}</span></div></div><div className="tool-list">{displayedToolCalls.map((call, index) => { const isHeld = call.decision === "held"; const result = call.decision; const tone = isHeld ? "amber" : result === "rejected" ? "muted" : "green"; return <div className={`tool-row ${isHeld ? "is-held" : ""}`} key={call.name}><div className="tool-index">0{index + 1}</div><div className="tool-main"><strong>{call.name}</strong><span>{call.target}</span></div><div className={`tool-result ${tone}`}><span className="result-dot" />{result}</div><div className="tool-latency">{call.latency}</div><ChevronRight size={15} className="tool-chevron" /></div>; })}</div></div>

            <div className="section-heading compact"><div><div className="eyebrow"><span className="eyebrow-line" />PROOF OF WORK</div><h2>Decision trail</h2></div><button className="ghost-button" onClick={() => { setActiveNav("Audit trail"); notify("Audit trail view selected"); }}>View full audit <ArrowUpRight size={14} /></button></div>
            <div className="audit-card"><div className="audit-line" />{liveRun ? liveRun.actions.map((action, index) => { const Icon = action.name === "send_email" ? Send : FileCheck2; const state = action.decision === "held" ? "held" : action.decision === "rejected" ? "rejected" : "allowed"; return <div className="audit-event" key={`${action.name}-${index}`}><div className={`audit-icon ${state}`}><Icon size={15} /></div><div className="audit-copy"><div><strong>{action.name}</strong><span className={`inline-status ${state}`}>{state}</span></div><span>{action.target}</span></div><time>{new Date(action.timestamp).toLocaleTimeString()}</time>{index < liveRun.actions.length - 1 && <div className="audit-connector" />}</div> }) : <div className="audit-empty"><Fingerprint size={18} /><span>Start a protected run to populate the live audit trail.</span></div>}<div className="audit-footer"><span><Fingerprint size={14} /> {liveRun ? "Proof path attached to every decision" : "No audit events loaded"}</span><span className="audit-run">{liveRun?.runId || "run_pending"}</span></div></div>
          </div>

          <aside className="right-column">
            <div className="section-heading compact"><div><div className="eyebrow"><span className="eyebrow-line" />BOUNDARY WATCH</div><h2>What needs you</h2></div><span className="count-pill">{heldAction ? "01 pending" : "0 pending"}</span></div>
            <div className={`decision-card ${showDrawer && heldAction ? "open" : "resolved"}`}><div className="decision-top"><div className="risk-mark"><CircleAlert size={18} /></div><div><div className={`micro-label ${heldAction ? "amber-label" : ""}`}>{heldAction ? "ARMORIQ HOLD" : liveRun?.status === "rejected" ? "DECISION RESOLVED" : "NO ACTIVE HOLD"}</div><h3>{heldAction ? "Recipient outside plan" : liveRun?.status === "rejected" ? "Action rejected" : "No pending decision"}</h3></div><button className="card-close" onClick={() => setShowDrawer(false)}><X size={15} /></button></div><p className="decision-summary">{heldAction ? "The agent wants to send extracted invoice data to a recipient that was not included in the original authorization." : liveRun?.status === "rejected" ? "The held action was rejected before execution. No unauthorized side effect was written." : "Start a protected run to surface decisions that require your attention."}</p><div className="decision-fields"><div><span>PROPOSED ACTION</span><strong>{heldAction?.name || "—"}</strong></div><div><span>DATA SCOPE</span><strong>{heldAction ? "Vendor + totals + line items" : "—"}</strong></div><div><span>DESTINATION</span><strong className="destination">{heldAction?.target || "—"}</strong></div></div><div className="decision-reason"><ShieldCheck size={15} /><span>{heldAction?.reason || (liveRun?.status === "rejected" ? "Cancelled before execution." : "No action is currently waiting.")}</span></div><div className="decision-actions"><button className="reject-button" onClick={() => void reject()} disabled={pendingAction !== null}>{pendingAction === "reject" ? "Rejecting…" : "Reject action"}</button><button className="approve-button" onClick={() => void approve()} disabled={pendingAction !== null}>{pendingAction === "approve" ? <><TimerReset size={15} className="spin" /> Approving…</> : <><BadgeCheck size={15} /> Approve & resume</>}</button></div><div className="decision-foot"><span><Clock3 size={13} /> {heldAction ? "Awaiting decision" : "No pending action"}</span><span>policy: {liveRun?.plan.id || "not loaded"}</span></div></div>
            <div className="mini-card"><div className="mini-card-head"><div><div className="eyebrow"><span className="eyebrow-line" />SYSTEM PULSE</div><h3>Agent health</h3></div><Gauge size={17} /></div><div className="health-row"><div><strong>{liveRun ? "API" : "—"}</strong><span>{liveRun ? "reachable" : "waiting"}</span></div><div><strong>{liveRun?.actions.length || 0}</strong><span>actions in run</span></div><div><strong>{liveRun?.outbox.length || 0}</strong><span>outbox effects</span></div></div><div className="health-bars"><div><span>Tool execution</span><i><b style={{ width: "96%" }} /></i><em>96%</em></div><div><span>Plan adherence</span><i><b style={{ width: "100%" }} /></i><em>{liveRun ? "100%" : "—"}</em></div></div></div>
            <div className="principle-card"><div className="principle-number">01</div><div><div className="micro-label">DESIGN PRINCIPLE</div><h3>Do not slow the agent down.</h3><p>Make the boundary precise enough that routine work stays invisible—and meaningful decisions become impossible to miss.</p></div></div>
          </aside>
        </section>

        </>}
        {apiError && <div className="api-status" role="status">{apiError}</div>}
        <footer className="page-footer"><span><span className="status-dot live" /> Pactline control center · v0.8 concept build</span><span>{liveRun ? `Last API sync ${new Date(liveRun.createdAt).toLocaleTimeString()}` : "Waiting for API sync"} <span className="footer-sep">/</span> <button className="footer-link-button" onClick={() => void loadRunState()} disabled={isLoading}>{isLoading ? "Syncing…" : "Refresh data"} <ArrowUpRight size={12} /></button></span></footer>
      </main>
      {toast && <div className="toast"><Zap size={15} /><span>{toast}</span></div>}
    </div>
  );
}
