export type DepartmentId = "product" | "engineering" | "growth" | "operations";
export type AgentStatus = "working" | "reviewing" | "idle" | "blocked";
export type RunStatus = "planned" | "running" | "waiting_approval" | "completed" | "failed";
export type TaskStatus = "queued" | "running" | "blocked" | "waiting_approval" | "completed" | "failed";
export type RiskLevel = "low" | "medium" | "high";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export type Agent = {
  id: string;
  name: string;
  role: string;
  department: DepartmentId;
  initials: string;
  status: AgentStatus;
  currentTask: string;
  tools: string[];
  autonomy: 0 | 1 | 2 | 3 | 4;
  skills: string[];
};

export type Activity = {
  id: string;
  time: string;
  agent: string;
  verb: string;
  detail: string;
  kind: "code" | "design" | "research" | "qa" | "ops";
};

export type Mission = {
  id: string;
  title: string;
  description: string;
  priority: "P0" | "P1" | "P2";
  progress: number;
  status: "active" | "queued" | "blocked" | "done";
  owner: string;
};

export type Approval = {
  id: string;
  runId?: string;
  taskId?: string;
  title: string;
  detail: string;
  risk: RiskLevel;
  requestedBy: string;
  status: ApprovalStatus;
  action?: {
    type: "github.create_branch" | "github.create_issue" | "none";
    payload?: Record<string, string>;
  };
  createdAt: string;
  resolvedAt?: string;
};

export type AgentAssignment = {
  taskId: string;
  agentId: string;
  agent: string;
  role: string;
  task: string;
  status: TaskStatus;
  risk: RiskLevel;
};

export type AgentRun = {
  id: string;
  objective: string;
  leadAgentId: string;
  lead: string;
  status: RunStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
};

export type AgentTask = {
  id: string;
  runId: string;
  agentId: string;
  agent: string;
  role: string;
  department: DepartmentId;
  title: string;
  instructions: string;
  status: TaskStatus;
  risk: RiskLevel;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type ArtifactKind = "spec" | "research" | "code_plan" | "qa_report" | "launch_plan" | "ops_checklist" | "integration_snapshot";

export type RunArtifact = {
  id: string;
  runId: string;
  taskId: string;
  agentId: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  createdAt: string;
};

export type ExecutionEvent = {
  id: string;
  runId?: string;
  taskId?: string;
  createdAt: string;
  actor: string;
  type: "run.planned" | "run.started" | "run.completed" | "task.started" | "task.completed" | "approval.created" | "approval.resolved" | "integration.checked" | "error";
  message: string;
};

export type HqState = {
  version: 1;
  runs: AgentRun[];
  tasks: AgentTask[];
  artifacts: RunArtifact[];
  approvals: Approval[];
  events: ExecutionEvent[];
};