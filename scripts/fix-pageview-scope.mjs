import { readFile, writeFile } from "node:fs/promises";
const path = new URL("../client/src/pages/Home.tsx", import.meta.url);
let source = await readFile(path, "utf8");
const start = source.indexOf('function PageView(');
const end = source.indexOf('export default function Home()');
if (start < 0 || end < 0) throw new Error("PageView boundaries not found");
const replacement = `function PageView({ page, darkMode, notify }: { page: string; darkMode: boolean; notify: (message: string) => void }) {
  const pageData: Record<string, { eyebrow: string; title: string; description: string }> = {
    "Live runs": { eyebrow: "OBSERVABILITY / 02", title: "Live runs", description: "See autonomous work move through its authorization boundary in real time." },
    "Approval queue": { eyebrow: "OPERATOR CONTROL / 03", title: "Approval queue", description: "Only the decisions that change authority wait for a human." },
    "Audit trail": { eyebrow: "PROOF SYSTEM / 04", title: "Audit trail", description: "Every tool call carries its decision, target, and proof context." },
    "Intent plans": { eyebrow: "AUTHORITY / 05", title: "Intent plans", description: "Define what your agents can do before they start doing it." },
  };
  const data = pageData[page] ?? pageData["Live runs"];
  const isQueue = page === "Approval queue";
  return <section className={\`subpage \${darkMode ? "subpage-dark" : ""}\u007f`}>
    <div className="subpage-hero"><div><div className="eyebrow"><span className="eyebrow-line" />{data.eyebrow}</div><h1>{data.title}</h1><p>{data.description}</p></div><div className="subpage-orbit"><div className="orbit-core"><ShieldCheck size={26} /></div><span className="orbit-dot one" /><span className="orbit-dot two" /><span className="orbit-dot three" /></div></div>
    <div className="subpage-grid">
      <div className="subpage-panel wide"><div className="panel-header"><div><div className="micro-label">{isQueue ? "PENDING DECISION" : "SYSTEM STREAM"}</div><h2>{isQueue ? "Recipient outside plan" : "Authorization events"}</h2></div><span className={\`page-badge \${isQueue ? "amber" : "blue"}\u007f`}>{isQueue ? "01 pending" : "Live"}</span></div>
        {isQueue ? <><div className="queue-summary"><div className="risk-mark"><CircleAlert size={19} /></div><div><strong>send_email</strong><span>external-review@protonmail.test</span></div><div className="queue-time">Held for review</div></div><div className="queue-copy">The agent proposed sending extracted invoice data to a recipient that was not in the captured intent. The policy has paused execution before the side effect.</div><div className="decision-actions"><button className="reject-button" onClick={() => notify("Open the active run to submit a decision")}>Reject action</button><button className="approve-button" onClick={() => notify("Open the active run to approve this action")}><BadgeCheck size={15} /> Approve & resume</button></div></> : <div className="stream-list">{events.concat([{ time: "14:32:12", label: "Boundary evaluated", detail: "intent mismatch · proof attached", state: "held", icon: ShieldCheck }]).map((event, index) => { const Icon = event.icon; return <div className="stream-row" key={\`\${event.time}-\${index}\u007f`}><div className={\`stream-icon \${event.state}\u007f`}><Icon size={15} /></div><div><strong>{event.label}</strong><span>{event.detail}</span></div><time>{event.time}</time><span className={\`page-badge \${event.state === "held" ? "amber" : "green"}\u007f`}>{event.state}</span></div>; })}</div>}
      </div>
      <div className="subpage-panel"><div className="panel-header"><div><div className="micro-label">CURRENT CONTEXT</div><h2>Intent plan</h2></div><LockKeyhole size={17} className="panel-icon" /></div><div className="plan-card"><div className="plan-card-top"><BadgeCheck size={15} /><span>Signed · verified</span></div><strong>Invoice handling plan</strong><p>Read invoice → normalize fields → write ledger record → notify approved recipient</p><div className="plan-meta"><span>plan_2b90…8a1</span><span>14:32:07</span></div></div><button className="outline-action" onClick={() => notify("Plan details opened")}>Inspect authorization <ArrowUpRight size={14} /></button></div>
    </div>
  </section>;
}

`;
source = source.slice(0, start) + replacement + source.slice(end);
await writeFile(path, source);
