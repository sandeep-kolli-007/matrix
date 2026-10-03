"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { activities as seedActivities, agents, missions } from "@/lib/mock-data";
import { createBrowserRun, executeBrowserNext, readBrowserState, resetBrowserDemo, resolveBrowserApproval } from "@/lib/browser-engine";
import type { Agent, AgentAssignment, DepartmentId, HqState } from "@/lib/types";

type OrchestrationResult = {
  runId: string;
  objective: string;
  lead: string;
  assignments: AgentAssignment[];
};

type RuntimePayload = {
  state: HqState;
  integrations: {
    github: {
      configured: boolean;
      repo?: string;
      defaultBranch?: string;
      error?: string;
    };
    model: { configured: boolean; model?: string };
  };
};

const departmentMeta: Record<DepartmentId, { label: string; code: string }> = {
  product: { label: "Product Lab", code: "01" },
  engineering: { label: "Engineering", code: "02" },
  growth: { label: "Growth Studio", code: "03" },
  operations: { label: "Operations", code: "04" },
};

function shortTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function HQDashboard() {
  const [selected, setSelected] = useState<Agent | null>(agents[2]);
  const [command, setCommand] = useState("");
  const [running, setRunning] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<OrchestrationResult | null>(null);
  const [runtime, setRuntime] = useState<RuntimePayload | null>(null);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [artifactId, setArtifactId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const activeAgents = useMemo(() => agents.filter((a) => a.status !== "idle").length, []);

  const loadState = useCallback(async () => {
    const state = readBrowserState();
    const payload: RuntimePayload = {
      state,
      integrations: {
        github: { configured: false, repo: "static-demo", defaultBranch: "main" },
        model: { configured: false, model: "browser-local" },
      },
    };
    setRuntime(payload);
    setCurrentRunId((current) => current ?? payload.state.runs[0]?.id ?? null);
  }, []);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const currentRun = runtime?.state.runs.find((run) => run.id === currentRunId) ?? null;
  const currentTasks = (runtime?.state.tasks ?? []).filter((task) => task.runId === currentRunId).sort((a, b) => a.order - b.order);
  const runArtifacts = (runtime?.state.artifacts ?? []).filter((artifact) => artifact.runId === currentRunId);
  const selectedArtifact = runArtifacts.find((artifact) => artifact.id === artifactId) ?? runArtifacts[0] ?? null;
  const pendingApprovals = (runtime?.state.approvals ?? []).filter((approval) => approval.status === "pending");

  const activity = useMemo(() => {
    const live = (runtime?.state.events ?? []).slice(0, 8).map((event) => ({
      id: event.id,
      time: shortTime(event.createdAt),
      agent: event.actor,
      verb: event.type.split(".").pop()?.replaceAll("_", " ") ?? "updated",
      detail: event.message,
      kind: event.type.includes("task") ? "code" as const : event.type.includes("approval") ? "ops" as const : "research" as const,
    }));
    return live.length ? live : seedActivities;
  }, [runtime]);

  async function runObjective(event: FormEvent) {
    event.preventDefault();
    if (!command.trim() || running) return;
    setRunning(true);
    setResult(null);
    try {
      const data = createBrowserRun(command) as OrchestrationResult;
      setResult(data);
      setCurrentRunId(data.runId);
      setCommand("");
      await loadState();
      setToast(`Mission created · ${data.assignments.length} agents assigned`);
    } catch {
      setToast("Planning failed. Try again.");
    } finally {
      setRunning(false);
      window.setTimeout(() => setToast(null), 2600);
    }
  }

  async function executeNext() {
    if (!currentRunId || executing) return;
    setExecuting(true);
    try {
      const payload = executeBrowserNext(currentRunId) as { artifact?: { id: string }; approval?: unknown };
      if (payload.artifact?.id) setArtifactId(payload.artifact.id);
      await loadState();
      setToast(payload.approval ? "Agent finished · founder approval required" : "Agent task completed");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Execution failed");
    } finally {
      setExecuting(false);
      window.setTimeout(() => setToast(null), 2800);
    }
  }

  async function resolveApproval(approvalId: string, decision: "approve" | "reject") {
    try {
      resolveBrowserApproval(approvalId, decision);
      await loadState();
      setToast(`${decision === "approve" ? "Approved" : "Rejected"} · browser demo`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Approval failed");
    } finally {
      window.setTimeout(() => setToast(null), 2800);
    }
  }

  const github = runtime?.integrations.github;
  const canExecute = currentRun && !["completed", "failed", "waiting_approval"].includes(currentRun.status);

  return (
    <main className="shell">
      <aside className="rail">
        <div className="brandMark">L</div>
        <nav className="railNav" aria-label="Primary">
          <button className="railButton active" aria-label="HQ">⌂</button>
          <button className="railButton" aria-label="Missions">◫</button>
          <button className="railButton" aria-label="Agents">◇</button>
          <button className="railButton" aria-label="Artifacts">▱</button>
        </nav>
        <div className="founderAvatar">SK</div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><div className="eyebrow">LIFEOS / INTERNAL</div><h1>HQ</h1></div>
          <div className="topStats">
            <span><i className="statusDot" /> {activeAgents} active</span>
            <span>{runtime?.state.runs.length ?? 0} agent runs</span>
            <span className="integrationChip">GitHub · backend disabled on Pages</span>
            <span className="integrationChip">AI · browser demo</span>
          </div>
        </header>

        <section className="heroGrid">
          <div className="commandCard glass">
            <div className="commandHeader">
              <div><span className="sectionKicker">FOUNDER COMMAND</span><h2>What should the company accomplish?</h2></div>
              <span className="modeBadge"><i className="statusDot" /> LEVEL 2 AUTONOMY</span>
            </div>
            <form onSubmit={runObjective} className="commandForm">
              <textarea value={command} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setCommand(event.target.value)} placeholder="e.g. Build LifeOS wishlist tracking and prepare a reviewable implementation" rows={2} />
              <button type="submit" disabled={running || !command.trim()}>{running ? "Planning…" : "Create mission →"}</button>
            </form>
            <div className="quickCommands">
              <button onClick={() => setCommand("Prepare LifeOS for private beta launch")}>Prepare beta launch</button>
              <button onClick={() => setCommand("Build wishlist price tracking architecture and implementation plan")}>Plan wishlist tracker</button>
              <button onClick={() => setCommand("Audit onboarding for UX and engineering issues")}>Audit onboarding</button>
            </div>
            {result && <div className="planResult"><div className="planResultTop"><span>MISSION CREATED</span><strong>{result.lead} leading</strong></div>{result.assignments.slice(0, 4).map((assignment) => <div className="assignment" key={assignment.taskId}><div className="miniAvatar">{assignment.agent.slice(0, 2).toUpperCase()}</div><div><strong>{assignment.agent}</strong><p>{assignment.role} · {assignment.risk} risk</p></div></div>)}</div>}
          </div>

          <div className="missionCard glass">
            <div className="cardTitleRow"><span className="sectionKicker">PRIMARY MISSION</span><span className="priority">P0</span></div>
            <h2>{missions[0].title}</h2><p>{missions[0].description}</p>
            <div className="bigProgress"><span style={{ width: `${missions[0].progress}%` }} /></div>
            <div className="progressMeta"><strong>{missions[0].progress}%</strong><span>Owner · {missions[0].owner}</span></div>
            <div className="milestones"><span className="done">Core model</span><span className="done">Onboarding</span><span>QA gate</span><span>Launch</span></div>
          </div>
        </section>

        <section className="runConsole glass">
          <div className="panelHeader">
            <div><span className="sectionKicker">AGENT RUNTIME</span><h2>{currentRun ? currentRun.objective : "No mission selected"}</h2></div>
            {currentRun && <div className="runActions"><span className={`runStatus ${currentRun.status}`}>{currentRun.status.replaceAll("_", " ")}</span><button onClick={executeNext} disabled={!canExecute || executing}>{executing ? "Executing…" : currentRun.status === "waiting_approval" ? "Approval required" : "Execute next →"}</button></div>}
          </div>
          {currentRun ? <>
            <div className="runProgress"><span style={{ width: `${currentRun.progress}%` }} /></div>
            <div className="runBody">
              <div className="taskStack">
                {currentTasks.map((task) => <div className={`runtimeTask ${task.status}`} key={task.id}><span className="taskOrder">{String(task.order + 1).padStart(2, "0")}</span><div><strong>{task.agent} · {task.role}</strong><p>{task.title}</p></div><span className="taskStatus">{task.status.replaceAll("_", " ")}</span></div>)}
              </div>
              <div className="artifactPane">
                <div className="artifactHeader"><span>ARTIFACTS · {runArtifacts.length}</span>{runArtifacts.length > 1 && <select value={selectedArtifact?.id ?? ""} onChange={(e: ChangeEvent<HTMLSelectElement>) => setArtifactId(e.target.value)}>{runArtifacts.map((artifact) => <option key={artifact.id} value={artifact.id}>{artifact.title}</option>)}</select>}</div>
                {selectedArtifact ? <><strong>{selectedArtifact.title}</strong><pre>{selectedArtifact.content}</pre></> : <div className="emptyArtifact">Execute an agent task to produce the first artifact.</div>}
              </div>
            </div>
          </> : <div className="emptyRun">Create a mission above. The Chief of Staff will assign agents and persist the run.</div>}
        </section>

        <section className="mainGrid">
          <div className="officePanel glass">
            <div className="panelHeader"><div><span className="sectionKicker">LIVE COMPANY</span><h2>Office floor</h2></div><div className="legend"><span><i className="statusDot" /> Working</span><span><i className="idleDot" /> Idle</span></div></div>
            <div className="officeFloor">
              {(Object.keys(departmentMeta) as DepartmentId[]).map((department) => <section className={`department ${department}`} key={department}><div className="deptHeader"><span>{departmentMeta[department].code}</span><strong>{departmentMeta[department].label}</strong></div><div className="deskGrid">{agents.filter((agent) => agent.department === department).map((agent) => <button key={agent.id} className={`desk ${selected?.id === agent.id ? "selected" : ""}`} onClick={() => setSelected(agent)}><span className={`agentAvatar ${agent.status}`}>{agent.initials}</span><span className="deskSurface"><b>{agent.name}</b><small>{agent.role}</small></span><i className={`agentState ${agent.status}`} /></button>)}</div></section>)}
              <div className="coreNode"><span>✦</span><strong>Chief of Staff</strong><small>orchestration core</small></div>
            </div>
          </div>

          <aside className="agentPanel glass">
            {selected && <><div className="agentHero"><div className={`largeAvatar ${selected.status}`}>{selected.initials}</div><div><span className="sectionKicker">AGENT PROFILE</span><h2>{selected.name}</h2><p>{selected.role}</p></div></div><div className="agentStatus"><span>Status</span><strong>{selected.status}</strong></div><div className="currentTask"><span>NOW</span><p>{selected.currentTask}</p></div><div className="agentSection"><span>TOOLS</span><div className="tagRow">{selected.tools.map((tool) => <b key={tool}>{tool}</b>)}</div></div><div className="agentSection"><span>SKILLS</span><div className="skillList">{selected.skills.map((skill) => <p key={skill}>✓ {skill}</p>)}</div></div><div className="autonomy"><div><span>AUTONOMY</span><strong>Level {selected.autonomy}</strong></div><div className="autonomyBars">{[0,1,2,3,4].map((n) => <i key={n} className={n <= selected.autonomy ? "filled" : ""} />)}</div></div><button className="profileButton">Open agent workspace →</button></>}
          </aside>
        </section>

        <section className="bottomGrid">
          <div className="activityPanel glass"><div className="panelHeader"><div><span className="sectionKicker">EXECUTION LOG</span><h2>Live activity</h2></div><div className="panelTools"><button className="textButton" onClick={() => void loadState()}>Refresh</button><button className="textButton" onClick={() => { resetBrowserDemo(); setCurrentRunId(null); setArtifactId(null); void loadState(); }}>Reset demo</button></div></div><div className="activityList">{activity.slice(0,8).map((item) => <div className="activityItem" key={item.id}><span className="activityTime">{item.time}</span><span className={`activityIcon ${item.kind}`}>{item.kind === "code" ? "⌘" : item.kind === "qa" ? "✓" : item.kind === "design" ? "✦" : "•"}</span><p><strong>{item.agent}</strong> {item.verb} <span>{item.detail}</span></p></div>)}</div></div>
          <div className="approvalPanel glass"><div className="panelHeader"><div><span className="sectionKicker">FOUNDER GATE</span><h2>Approvals</h2></div><span className="approvalCount">{pendingApprovals.length}</span></div>{pendingApprovals.length ? pendingApprovals.map((approval) => <div className="approvalItem" key={approval.id}><div className={`riskMark ${approval.risk}`} /><div className="approvalCopy"><strong>{approval.title}</strong><p>{approval.detail}</p><span>{approval.requestedBy} · {approval.risk} risk</span></div><div className="approvalActions"><button className="reject" onClick={() => void resolveApproval(approval.id, "reject")}>Reject</button><button onClick={() => void resolveApproval(approval.id, "approve")}>Approve</button></div></div>) : <div className="emptyApprovals">No actions are waiting for you.</div>}</div>
        </section>
      </section>
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}