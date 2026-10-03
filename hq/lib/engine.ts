import { createBranch, createIssue, getGitHubSnapshot } from "./github";
import { planObjective } from "./planner";
import { executeTask } from "./runtime";
import { readState, updateState } from "./store";
import type { AgentRun, Approval } from "./types";

export class HqEngineError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "HqEngineError";
    this.status = status;
  }
}

export async function getRuntimeSnapshot() {
  const [state, github] = await Promise.all([readState(), getGitHubSnapshot()]);
  return { state, integrations: { github } };
}

export async function createRun(objectiveInput: string) {
  const objective = objectiveInput.trim();
  if (!objective) throw new HqEngineError("Objective is required", 400);

  const { runId, lead, tasks } = planObjective(objective);
  const now = new Date().toISOString();
  const run: AgentRun = {
    id: runId,
    objective,
    leadAgentId: lead.id,
    lead: lead.name,
    status: "planned",
    progress: 0,
    createdAt: now,
    updatedAt: now,
  };

  await updateState((state) => {
    state.runs.unshift(run);
    state.tasks.push(...tasks);
    state.events.unshift({
      id: `event_${Date.now()}_planned`,
      runId,
      createdAt: now,
      actor: "Chief of Staff",
      type: "run.planned",
      message: `Planned objective and assigned ${tasks.length} workstreams`,
    });
  });

  return {
    runId,
    objective,
    status: run.status,
    createdAt: now,
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

export async function executeNextTask(runId: string) {
  return updateState(async (state) => {
    const run = state.runs.find((item) => item.id === runId);
    if (!run) throw new HqEngineError("Run not found", 404);
    if (run.status === "failed") throw new HqEngineError("Run has failed", 409);
    if (run.status === "completed") return { run, task: null, artifact: null, approval: null };

    const tasks = state.tasks.filter((task) => task.runId === runId).sort((a, b) => a.order - b.order);
    if (!tasks.length) throw new HqEngineError("Run has no tasks", 409);

    if (tasks.some((task) => task.status === "waiting_approval")) {
      throw new HqEngineError("Run is waiting for founder approval", 409);
    }

    const nextTask = tasks.find((task) => task.status === "queued");
    if (!nextTask) {
      if (tasks.every((task) => task.status === "completed")) {
        run.status = "completed";
        run.progress = 100;
        run.updatedAt = new Date().toISOString();
      }
      return { run, task: null, artifact: null, approval: null };
    }

    const startedAt = new Date().toISOString();
    const wasPlanned = run.status === "planned";
    run.status = "running";
    run.updatedAt = startedAt;
    nextTask.status = "running";
    nextTask.updatedAt = startedAt;

    if (wasPlanned) {
      state.events.unshift({
        id: `event_${Date.now()}_run_start`,
        runId,
        createdAt: startedAt,
        actor: "Chief of Staff",
        type: "run.started",
        message: `Started objective: ${run.objective}`,
      });
    }

    state.events.unshift({
      id: `event_${Date.now()}_task_start`,
      runId,
      taskId: nextTask.id,
      createdAt: startedAt,
      actor: nextTask.agent,
      type: "task.started",
      message: nextTask.title,
    });

    try {
      const execution = await executeTask(nextTask, run.objective);
      state.artifacts.unshift(execution.artifact);
      let approval: Approval | null = null;

      if (execution.needsApproval) {
        nextTask.status = "waiting_approval";
        run.status = "waiting_approval";
        approval = {
          id: `approval_${Date.now()}_${nextTask.id}`,
          runId,
          taskId: nextTask.id,
          title: `Authorize GitHub branch for ${nextTask.agent}`,
          detail: `Create a dedicated work branch for: ${run.objective}`,
          risk: nextTask.risk,
          requestedBy: nextTask.agent,
          status: "pending",
          action: {
            type: "github.create_branch",
            payload: { branchName: `hq/${run.id.slice(-8)}-${nextTask.agentId}` },
          },
          createdAt: new Date().toISOString(),
        };
        state.approvals.unshift(approval);
        state.events.unshift({
          id: `event_${Date.now()}_approval`,
          runId,
          taskId: nextTask.id,
          createdAt: approval.createdAt,
          actor: nextTask.agent,
          type: "approval.created",
          message: approval.title,
        });
      } else {
        nextTask.status = "completed";
        state.events.unshift({
          id: `event_${Date.now()}_task_done`,
          runId,
          taskId: nextTask.id,
          createdAt: new Date().toISOString(),
          actor: nextTask.agent,
          type: "task.completed",
          message: nextTask.title,
        });
      }

      nextTask.updatedAt = new Date().toISOString();
      const completed = tasks.filter((task) => task.status === "completed").length;
      run.progress = Math.round((completed / tasks.length) * 100);

      if (tasks.every((task) => task.status === "completed")) {
        run.status = "completed";
        run.progress = 100;
        state.events.unshift({
          id: `event_${Date.now()}_run_done`,
          runId,
          createdAt: new Date().toISOString(),
          actor: "Chief of Staff",
          type: "run.completed",
          message: `Completed objective: ${run.objective}`,
        });
      }

      run.updatedAt = new Date().toISOString();
      return { run, task: nextTask, artifact: execution.artifact, approval };
    } catch (error) {
      if (error instanceof HqEngineError) throw error;
      nextTask.status = "failed";
      nextTask.updatedAt = new Date().toISOString();
      run.status = "failed";
      run.updatedAt = new Date().toISOString();
      const message = error instanceof Error ? error.message : "Task execution failed";
      state.events.unshift({
        id: `event_${Date.now()}_error`,
        runId,
        taskId: nextTask.id,
        createdAt: new Date().toISOString(),
        actor: nextTask.agent,
        type: "error",
        message,
      });
      return { __error: true as const, message, status: 500 };
    }
  }).then((outcome) => {
    if ((outcome as { __error?: boolean }).__error === true) {
      const failure = outcome as { __error: true; message: string; status: number };
      throw new HqEngineError(failure.message, failure.status);
    }
    return outcome;
  });
}

export async function resolveFounderApproval(approvalId: string, decision: "approve" | "reject") {
  return updateState(async (state) => {
    const approval = state.approvals.find((item) => item.id === approvalId);
    if (!approval) throw new HqEngineError("Approval not found", 404);
    if (approval.status !== "pending") throw new HqEngineError("Approval already resolved", 409);

    let externalResult: unknown = null;
    if (decision === "approve" && approval.action?.type === "github.create_branch") {
      const branchName = approval.action.payload?.branchName ?? `hq/${Date.now()}`;
      externalResult = await createBranch(branchName);
    }
    if (decision === "approve" && approval.action?.type === "github.create_issue") {
      externalResult = await createIssue(approval.title, approval.detail);
    }

    approval.status = decision === "approve" ? "approved" : "rejected";
    approval.resolvedAt = new Date().toISOString();

    const task = approval.taskId ? state.tasks.find((item) => item.id === approval.taskId) : undefined;
    const run = approval.runId ? state.runs.find((item) => item.id === approval.runId) : undefined;

    if (task) {
      task.status = decision === "approve" ? "completed" : "blocked";
      task.updatedAt = new Date().toISOString();
    }

    if (run) {
      const tasks = state.tasks.filter((item) => item.runId === run.id);
      const completed = tasks.filter((item) => item.status === "completed").length;
      run.progress = Math.round((completed / Math.max(tasks.length, 1)) * 100);
      run.status = decision === "approve"
        ? (tasks.every((item) => item.status === "completed") ? "completed" : "running")
        : "failed";
      run.updatedAt = new Date().toISOString();

      if (run.status === "completed") {
        state.events.unshift({
          id: `event_${Date.now()}_run_done`,
          runId: run.id,
          createdAt: new Date().toISOString(),
          actor: "Chief of Staff",
          type: "run.completed",
          message: `Completed objective: ${run.objective}`,
        });
      }
    }

    state.events.unshift({
      id: `event_${Date.now()}_resolve`,
      runId: approval.runId,
      taskId: approval.taskId,
      createdAt: new Date().toISOString(),
      actor: "Founder",
      type: "approval.resolved",
      message: `${decision === "approve" ? "Approved" : "Rejected"}: ${approval.title}`,
    });

    return { approval, externalResult, run, task };
  });
}