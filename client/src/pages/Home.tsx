/* Signal & Stewardship: evidence before decoration, asymmetric command layout, ink + warm paper + Signal Green, exact operator-first copy. */
import { useMemo, useState } from "react";
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

const toolCalls = [
  { name: "read_invoice", target: "inbox/northstar_invoice_044.pdf", result: "Allowed", tone: "green", latency: "112ms" },
  { name: "extract_fields", target: "invoice_id · vendor · amount · line_items", result: "Allowed", tone: "green", latency: "684ms" },
  { name: "write_record", target: "ledger.invoices / INV-044", result: "Allowed", tone: "green", latency: "87ms" },
  { name: "send_email", target: "external-review@protonmail.test", result: "Held", tone: "amber", latency: "Awaiting decision" },
];

function PageView({ page, darkMode, notify }: { page: string; darkMode: boolean; notify: (message: string) => void }) {
  const pageData: Record<string, { eyebrow: string; title: string; description: string }> = {
    "Live runs": { eyebrow: "OBSERVABILITY / 02", title: "Live runs", description: "See autonomous work move through its authorization boundary in real time." },
    "Approval queue": { eyebrow: "OPERATOR CONTROL / 03", title: "Approval queue", description: "Only the decisions that change authority wait for a human." },
    "Audit trail": { eyebrow: "PROOF SYSTEM / 04", title: "Audit trail", description: "Every tool call carries its decision, target, and proof context." },
    "Intent plans": { eyebrow: "AUTHORITY / 05", title: "Intent plans", description: "Define what your agents can do before they start doing it." },
  };
  const data = pageData[page] ?? pageData["Live runs"];
  const isQueue = page === "Approval queue";
  return <section className={`subpage ${darkMode ? "subpage-dark" : ""}`}>
    <div className="subpage-hero"><div><div className="eyebrow"><span className="eyebrow-line" />{data.eyebrow}</div><h1>{data.title}</h1><p>{data.description}</p></div><div className="subpage-orbit"><div className="orbit-core"><ShieldCheck size={26} /></div><span className="orbit-dot one" /><span className="orbit-dot two" /><span className="orbit-dot three" /></div></div>
    <div className="subpage-grid">
      <div className="subpage-panel wide"><div className="panel-header"><div><div className="micro-label">{isQueue ? "PENDING DECISION" : "SYSTEM STREAM"}</div><h2>{isQueue ? "Recipient outside plan" : "Authorization events"}</h2></div><span className={`page-badge ${isQueue ? "amber" : "blue"}`}>{isQueue ? "01 pending" : "Live"}</span></div>
        {isQueue ? <><div className="queue-summary"><div className="risk-mark"><CircleAlert size={19} /></div><div><strong>send_email</strong><span>external-review@protonmail.test</span></div><div className="queue-time">Held 38s ago</div></div><div className="queue-copy">The agent proposed sending extracted invoice data to a recipient that was not in the captured intent. ArmorIQ has paused execution before the side effect.</div><div className="decision-actions"><button className="reject-button" onClick={() => notify("Rejected · unauthorized action did not execute")}>Reject action</button><button className="approve-button" onClick={() => notify("Approved · run resumed through ArmorIQ")}><BadgeCheck size={15} /> Approve & resume</button></div></> : <div className="stream-list">{events.concat([{ time: "14:32:12", label: "Boundary evaluated", detail: "intent mismatch · proof attached", state: "held", icon: ShieldCheck }]).map((event, index) => { const Icon = event.icon; return <div className="stream-row" key={`${event.time}-${index}`}><div className={`stream-icon ${event.state}`}><Icon size={15} /></div><div><strong>{event.label}</strong><span>{event.detail}</span></div><time>{event.time}</time><span className={`page-badge ${event.state === "held" ? "amber" : "green"}`}>{event.state}</span></div>; })}</div>}
      </div>
      <div className="subpage-panel"><div className="panel-header"><div><div className="micro-label">CURRENT CONTEXT</div><h2>Intent plan</h2></div><LockKeyhole size={17} className="panel-icon" /></div><div className="plan-card"><div className="plan-card-top"><BadgeCheck size={15} /><span>Signed · verified</span></div><strong>Invoice handling plan</strong><p>Read invoice → normalize fields → write ledger record → notify approved recipient</p><div className="plan-meta"><span>plan_2b90…8a1</span><span>14:32:07</span></div></div><button className="outline-action" onClick={() => notify("Plan details opened")}>Inspect authorization <ArrowUpRight size={14} /></button></div>
    </div>
  </section>;
}

export default function Home() {
  const [activeNav, setActiveNav] = useState(() => new URLSearchParams(window.location.search).get("page") || "Overview");
  const [runState, setRunState] = useState<"idle" | "running" | "held" | "approved">("held");
  const [showDrawer, setShowDrawer] = useState(true);
  const [toast, setToast] = useState("");
  const [darkMode, setDarkMode] = useState(() => new URLSearchParams(window.location.search).get("theme") === "dark" || window.localStorage.getItem("intentfence-theme") === "dark");

  const stateCopy = useMemo(() => {
    if (runState === "approved") return { label: "Action approved", sub: "Run resumed · 14:33:01", tone: "green" };
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

  const simulateRun = () => {
    setRunState("running");
    notify("Intent captured · agent run started");
    window.setTimeout(() => setRunState("held"), 1300);
  };

  const approve = () => {
    setRunState("approved");
    setShowDrawer(false);
    notify("Approved · agent resumed through ArmorIQ");
  };

  const reject = () => {
    setRunState("idle");
    setShowDrawer(false);
    notify("Rejected · unauthorized action did not execute");
  };

  return (
    <div className={`app-shell ${darkMode ? "dark-mode" : ""}`}>
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark-wrap"><img src="/manus-storage/pactline-mark_183c1341.png" alt="Pactline mark" /></div>
          <div><div className="brand-name">pact<span>line</span></div><div className="brand-sub">operator control</div></div>
        </div>
        <div className="workspace-switch"><div className="workspace-avatar">PL</div><div><div className="workspace-name">Finance Ops</div><div className="workspace-meta">Protected workspace</div></div><ChevronDown size={14} /></div>
        <nav className="nav-stack" aria-label="Primary navigation">
          {[
            ["Overview", LayoutDashboard],
            ["Live runs", Radio],
            ["Approval queue", Inbox],
            ["Audit trail", Fingerprint],
            ["Intent plans", LockKeyhole],
          ].map(([label, Icon]: any) => (
            <button key={label} onClick={() => { setActiveNav(label); notify(`${label} view selected`); }} className={`nav-item ${activeNav === label ? "active" : ""}`}>
              <Icon size={16} strokeWidth={activeNav === label ? 2.4 : 1.8} /><span>{label}</span>{label === "Approval queue" && <span className="nav-count">01</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="system-note"><div className="status-dot live" /><div><div className="micro-label">ArmorIQ link</div><div className="system-state">Connected · live</div></div></div>
          <button className="nav-item" onClick={() => notify("Settings are part of the next build phase")}><KeyRound size={16} /><span>Workspace settings</span></button>
          <div className="user-card"><div className="user-avatar"><UserRound size={16} /></div><div><div className="workspace-name">Aarav Mehta</div><div className="workspace-meta">Owner · admin</div></div><MoreHorizontal size={16} /></div>
        </div>
      </aside>

      <main className="main-canvas">
        <header className="topbar">
          <div className="breadcrumbs"><span>Finance Ops</span><ChevronRight size={14} /><strong>Control center</strong></div>
          <div className="top-actions"><div className="search-box"><Search size={15} /><span>Search runs, invoices…</span><kbd>⌘ K</kbd></div><button className="icon-button theme-toggle" aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} onClick={toggleDarkMode}>{darkMode ? <Sun size={17} /> : <Moon size={17} />}</button><button className="icon-button" aria-label="Notifications" onClick={() => notify("No new notifications")}><Bell size={17} /><span className="notification-dot" /></button><button className="mobile-menu" aria-label="Open menu"><Menu size={18} /></button></div>
        </header>

        {activeNav !== "Overview" ? <PageView page={activeNav} darkMode={darkMode} notify={notify} /> : <>
        <section className="hero-band">
          <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" />AUTONOMOUS OPERATIONS / 01</div><h1>Autonomy is active.<br /><em>Authority is bounded.</em></h1><p>Pactline lets your agent move through routine invoice work while ArmorIQ holds the exact moment an action leaves its captured intent.</p><div className="hero-actions"><button className="primary-button" onClick={simulateRun}><Play size={15} fill="currentColor" /> Run protected demo <ArrowUpRight size={15} /></button><button className="text-button" onClick={() => notify("Architecture view opened")}>View architecture <ChevronRight size={15} /></button></div></div>
          <div className="hero-visual"><img src="/manus-storage/intentfence-hero-texture_24980018.png" alt="Abstract authorization signal texture" /><div className="hero-visual-overlay"><div className="signal-ring"><ShieldCheck size={31} /></div><div><div className="micro-label">CURRENT BOUNDARY</div><div className="hero-visual-title">Invoice handling plan</div><div className="hero-visual-meta"><span className="status-dot live" />Signed · verified · 14:32:07</div></div></div></div>
        </section>

        <section className="status-strip"><div className="status-primary"><div className={`status-pulse ${stateCopy.tone}`}><span /></div><div><div className="micro-label">RUN STATUS</div><div className="status-title">{stateCopy.label}</div></div><div className="status-divider" /><div><div className="micro-label">RUN ID</div><div className="status-code">run_7F3A9C</div></div></div><div className="status-metrics"><div><div className="micro-label">ALLOWED TODAY</div><strong>128</strong><span className="metric-up">+12%</span></div><div><div className="micro-label">HELD FOR REVIEW</div><strong className="amber-text">01</strong></div><div><div className="micro-label">AVG. DECISION</div><strong>380<span className="unit">ms</span></strong></div></div></section>

        <section className="content-grid">
          <div className="primary-column">
            <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" />ACTIVE RUN</div><h2>Invoice #044 <span className="inline-status amber">Human decision required</span></h2></div><button className="ghost-button" onClick={() => setShowDrawer(true)}>Open run details <ArrowUpRight size={14} /></button></div>
            <div className="run-card"><div className="run-card-top"><div className="file-badge"><FileText size={18} /></div><div className="file-info"><strong>northstar_invoice_044.pdf</strong><span>Received 14:32:07 · 482 KB · source: inbox</span></div><div className="run-progress"><div className="progress-label"><span>3 of 4 actions complete</span><span>75%</span></div><div className="progress-track"><div className="progress-fill" style={{ width: runState === "approved" ? "100%" : "75%" }} /></div></div><button className="icon-button quiet"><MoreHorizontal size={17} /></button></div><div className="intent-ribbon"><div className="ribbon-icon"><LockKeyhole size={14} /></div><div><div className="micro-label">CAPTURED INTENT</div><div className="intent-copy">Read invoice → normalize fields → write ledger record → notify approved recipient</div></div><div className="ribbon-proof"><BadgeCheck size={15} /><span>plan_2b90…8a1</span></div></div><div className="tool-list">{toolCalls.map((call, index) => <div className={`tool-row ${call.tone === "amber" ? "is-held" : ""}`} key={call.name}><div className="tool-index">0{index + 1}</div><div className="tool-main"><strong>{call.name}</strong><span>{call.target}</span></div><div className={`tool-result ${call.tone}`}><span className="result-dot" />{call.result}</div><div className="tool-latency">{call.latency}</div><ChevronRight size={15} className="tool-chevron" /></div>)}</div></div>

            <div className="section-heading compact"><div><div className="eyebrow"><span className="eyebrow-line" />PROOF OF WORK</div><h2>Decision trail</h2></div><button className="ghost-button" onClick={() => { setActiveNav("Audit trail"); notify("Audit trail view selected"); }}>View full audit <ArrowUpRight size={14} /></button></div>
            <div className="audit-card"><div className="audit-line" />{events.map((event, index) => { const Icon = event.icon; return <div className="audit-event" key={event.time}><div className={`audit-icon ${event.state}`}><Icon size={15} /></div><div className="audit-copy"><div><strong>{event.label}</strong><span className={`inline-status ${event.state}`}>{event.state === "held" ? "Held" : "Allowed"}</span></div><span>{event.detail}</span></div><time>{event.time}</time>{index < events.length - 1 && <div className="audit-connector" />}</div> })}<div className="audit-footer"><span><Fingerprint size={14} /> Proof path attached to every decision</span><span className="audit-run">run_7F3A9C · today</span></div></div>
          </div>

          <aside className="right-column">
            <div className="section-heading compact"><div><div className="eyebrow"><span className="eyebrow-line" />BOUNDARY WATCH</div><h2>What needs you</h2></div><span className="count-pill">01 pending</span></div>
            <div className={`decision-card ${showDrawer ? "open" : ""}`}><div className="decision-top"><div className="risk-mark"><CircleAlert size={18} /></div><div><div className="micro-label amber-label">ARMORIQ HOLD</div><h3>Recipient outside plan</h3></div><button className="card-close" onClick={() => setShowDrawer(false)}><X size={15} /></button></div><p className="decision-summary">The agent wants to send extracted invoice data to a recipient that was not included in the original authorization.</p><div className="decision-fields"><div><span>PROPOSED ACTION</span><strong>send_email</strong></div><div><span>DATA SCOPE</span><strong>Vendor + totals + line items</strong></div><div><span>DESTINATION</span><strong className="destination">external-review@protonmail.test</strong></div></div><div className="decision-reason"><ShieldCheck size={15} /><span>Blocked by intent mismatch, not a keyword rule.</span></div><div className="decision-actions"><button className="reject-button" onClick={reject}>Reject action</button><button className="approve-button" onClick={approve}><BadgeCheck size={15} /> Approve & resume</button></div><div className="decision-foot"><span><Clock3 size={13} /> Held 38s ago</span><span>policy: intent-bound-v1</span></div></div>
            <div className="mini-card"><div className="mini-card-head"><div><div className="eyebrow"><span className="eyebrow-line" />SYSTEM PULSE</div><h3>Agent health</h3></div><Gauge size={17} /></div><div className="health-row"><div><strong>99.8%</strong><span>availability</span></div><div><strong>4.2k</strong><span>actions / week</span></div><div><strong>0</strong><span>silent failures</span></div></div><div className="health-bars"><div><span>Tool execution</span><i><b style={{ width: "96%" }} /></i><em>96%</em></div><div><span>Plan adherence</span><i><b style={{ width: "100%" }} /></i><em>100%</em></div></div></div>
            <div className="principle-card"><div className="principle-number">01</div><div><div className="micro-label">DESIGN PRINCIPLE</div><h3>Do not slow the agent down.</h3><p>Make the boundary precise enough that routine work stays invisible—and meaningful decisions become impossible to miss.</p></div></div>
          </aside>
        </section>

        </>}
        <footer className="page-footer"><span><span className="status-dot live" /> Pactline control center · v0.8 concept build</span><span>Last policy sync 14:32:07 <span className="footer-sep">/</span> <a href="#" onClick={(e) => { e.preventDefault(); notify("Documentation is coming in the build phase"); }}>SDK documentation <ArrowUpRight size={12} /></a></span></footer>
      </main>
      {toast && <div className="toast"><Zap size={15} /><span>{toast}</span></div>}
    </div>
  );
}
