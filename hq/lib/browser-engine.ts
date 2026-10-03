"use client";

import { agents } from "./mock-data";
import { planObjective } from "./planner";
import type { AgentRun, Approval, HqState, RunArtifact } from "./types";

const STORAGE_KEY = "lifeos-hq-pages-state-v1";

function now() {
  return new Date().toISOString();
}

function emptyState(): HqState {
  return { version: 1, runs: [], tasks: [], artifacts: [], approvals: [], events: [] };
}

export function readBrowserState(): HqState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return JSON.parse(raw) as HqState;
  } catch {
    return emptyState();
  }
}

function writeBrowserState(state: HqState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

function updateState(mutator: (state: HqState) => void) {
  const state = structuredClone(readBrowserState());
  mutator(state);
  writeBrowserState(state);
  return state;
}

export function createBrowserRun(objectiveInput: string) {
  const objective = objectiveInput.trim();
  if (!objective) throw new Error("Objective is required");

  const { runId, lead, tasks } = planObjective(objective);
  const createdAt = now();
  const run: AgentRun = {
    id: runId,
    objective,
    leadAgentId: lead.id,
    lead: lead.name,
    status: "planned",
    progress: 0,
    createdAt,
    updatedAt: createdAt,
  };

  updateState((state) => {
    state.runs.unshift(run);
    state.tasks.push(...tasks);
    state.events.unshift({
      id: `event_${Date.now()}_planned`,
      runId,
      createdAt,
      actor: "Chief of Staff",
      type: "run.planned",
      message: `Planned objective and assigned ${tasks.length} workstreams`,
    });
  });

  return {
    runId,
    objective,
    lead: lead.name,
    assignments: tasks.map((task) => ({
      taskId: task.id,
      agentId: task.agentId,
      agent: task.agent,
      role: task.role,
      task: task.instructions,
      status: task.status,
      risk: task.risk,
    })),
  };
}

function artifactFor(task: HqState["tasks"][number], objective: string): RunArtifact {
  const agent = agents.find((item) => item.id === task.agentId);
  const kind = task.department === "product" ? "spec" : task.department === "growth" ? "launch_plan" : task.agentId === "qa" ? "qa_report" : task.department === "operations" ? "ops_checklist" : "code_plan";
  const body = [
    `# ${task.title}`,
    "",
    `Objective: ${objective}`,
    `Owner: ${task.agent} · ${task.role}`,
    `Department: ${task.department}`,
    `Risk: ${task.risk}`,
    "",
    "## Agent output",
    task.instructions,
    "",
    "## Proposed next steps",
    "- Confirm the smallest shippable scope.",
    "- Identify affected modules, dependencies, and edge cases.",
    "- Define validation and rollback criteria.",
    "- Hand off consequential actions to the founder approval gate.",
    "",
    `Tools available: ${agent?.tools.join(", ") ?? "HQ tools"}`,
    "",
    "_GitHub Pages demo: this artifact is generated locally in your browser. Real repo/tool execution is intentionally disabled on static hosting._",
  ].join("\n");

  return {
    id: `artifact_${Date.now()}_${task.id}`,
    runId: task.runId,
    taskId: task.id,
    agentId: task.agentId,
    title: `${task.agent} · ${task.title}`,
    kind,
    content: body,
    createdAt: now(),
  };
}

export function executeBrowserNext(runId: string) {
  let result: { artifact?: RunArtifact; approval?: Approval | null } = {};
  updateState((state) => {
    const run = state.runs.find((item) => item.id === runId);
    if (!run) throw new Error("Run not found");
    if (run.status === "waiting_approval") throw new Error("Run is waiting for founder approval");
    if (run.status === "completed") return;

    const tasks = state.tasks.filter((item) => item.runId === runId).sort((a, b) => a.order - b.order);
    const task = tasks.find((item) => item.status === "queued");
    if (!task) {
      if (tasks.every((item) => item.status === "completed")) {
        run.status = "completed";
        run.progress = 100;
      }
      return;
    }

    const startedAt = now();
    run.status = "running";
    run.updatedAt = startedAt;
    task.status = "running";
    task.updatedAt = startedAt;
    state.events.unshift({
      id: `event_${Date.now()}_task_start`,
      runId,
      taskId: task.id,
      createdAt: startedAt,
      actor: task.agent,
      type: "task.started",
      message: task.title,
    });

    const artifact = artifactFor(task, run.objective);
    state.artifacts.unshift(artifact);
    result.artifact = artifact;

    if (task.risk === "medium" || task.risk === "high") {
      task.status = "waiting_approval";
      run.status = "waiting_approval";
      const approval: Approval = {
        id: `approval_${Date.now()}_${task.id}`,
        runId,
        taskId: task.id,
        title: `Authorize ${task.role} action`,
        detail: `Approve the next consequential step for: ${run.objective}`,
        risk: task.risk,
        requestedBy: task.agent,
        status: "pending",
        action: { type: "none" },
        createdAt: now(),
      };
      state.approvals.unshift(approval);
      state.events.unshift({
        id: `event_${Date.now()}_approval`,
        runId,
        taskId: task.id,
        createdAt: approval.createdAt,
        actor: task.agent,
        type: "approval.created",
        message: approval.title,
      });
      result.approval = approval;
    } else {
      task.status = "completed";
      task.updatedAt = now();
      state.events.unshift({
        id: `event_${Date.now()}_task_done`,
        runId,
        taskId: task.id,
        createdAt: now(),
        actor: task.agent,
        type: "task.completed",
        message: task.title,
      });
    }

    const completed = tasks.filter((item) => item.status === "completed").length;
    run.progress = Math.round((completed / Math.max(tasks.length, 1)) * 100);
    if (tasks.every((item) => item.status === "completed")) {
      run.status = "completed";
      run.progress = 100;
      state.events.unshift({
        id: `event_${Date.now()}_run_done`,
        runId,
        createdAt: now(),
        actor: "Chief of Staff",
        type: "run.completed",
        message: `Completed objective: ${run.objective}`,
      });
    }
    run.updatedAt = now();
  });
  return result;
}

export function resolveBrowserApproval(approvalId: string, decision: "approve" | "reject") {
  updateState((state) => {
    const approval = state.approvals.find((item) => item.id === approvalId);
    if (!approval) throw new Error("Approval not found");
    if (approval.status !== "pending") throw new Error("Approval already resolved");

    approval.status = decision === "approve" ? "approved" : "rejected";
    approval.resolvedAt = now();
    const task = approval.taskId ? state.tasks.find((item) => item.id === approval.taskId) : undefined;
    const run = approval.runId ? state.runs.find((item) => item.id === approval.runId) : undefined;

    if (task) {
      task.status = decision === "approve" ? "completed" : "blocked";
      task.updatedAt = now();
    }
    if (run) {
      const tasks = state.tasks.filter((item) => item.runId === run.id);
      const completed = tasks.filter((item) => item.status === "completed").length;
      run.progress = Math.round((completed / Math.max(tasks.length, 1)) * 100);
      run.status = decision === "approve" ? (tasks.every((item) => item.status === "completed") ? "completed" : "running") : "failed";
      run.updatedAt = now();
    }
    state.events.unshift({
      id: `event_${Date.now()}_resolve`,
      runId: approval.runId,
      taskId: approval.taskId,
      createdAt: now(),
      actor: "Founder",
      type: "approval.resolved",
      message: `${decision === "approve" ? "Approved" : "Rejected"}: ${approval.title}`,
    });
  });
}

export function resetBrowserDemo() {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
}