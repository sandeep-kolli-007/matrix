import { agents } from "./mock-data";
import type { Agent, AgentTask, DepartmentId, RiskLevel } from "./types";

const keywords: Record<string, string[]> = {
  maya: ["feature", "product", "scope", "beta", "roadmap", "user", "launch", "onboarding"],
  noah: ["research", "competitor", "user", "market", "flow", "validate", "audit"],
  alex: ["build", "architecture", "system", "api", "database", "agent", "repo", "github"],
  sam: ["mobile", "react native", "screen", "app", "ui", "component", "frontend"],
  ria: ["backend", "database", "supabase", "api", "sync", "auth", "postgres", "edge"],
  qa: ["test", "qa", "release", "bug", "beta", "regression", "audit"],
  ava: ["launch", "growth", "aso", "marketing", "landing", "positioning"],
  leo: ["content", "social", "creative", "copy", "video"],
  nina: ["operations", "legal", "compliance", "checklist", "launch", "process"],
};

function riskFor(agent: Agent, objective: string): RiskLevel {
  const lower = objective.toLowerCase();
  if (agent.id === "ria" && /(migration|database|schema|production)/.test(lower)) return "high";
  if (agent.id === "alex" && /(merge|deploy|branch|github|repo|production)/.test(lower)) return "medium";
  return "low";
}

function instructionFor(agent: Agent, objective: string, index: number) {
  if (index === 0) {
    return `Own the objective. Define scope, acceptance criteria, dependencies, and the smallest shippable outcome for: ${objective}`;
  }

  const byDepartment: Record<DepartmentId, string> = {
    product: `Produce product/UX analysis for: ${objective}. Call out assumptions, user impact, and acceptance criteria.`,
    engineering: `Produce an implementation-ready engineering contribution for: ${objective}. Include files/modules, contracts, risks, and validation steps.`,
    growth: `Produce launch/growth contribution for: ${objective}. Include audience, message, channel, and measurable outcome.`,
    operations: `Produce an operations/readiness contribution for: ${objective}. Include blockers, approvals, compliance, and a checklist.`,
  };
  return byDepartment[agent.department];
}

export function planObjective(objective: string) {
  const lower = objective.toLowerCase();
  const scored = agents
    .map((agent) => ({
      agent,
      score: (keywords[agent.id] ?? []).reduce((sum, keyword) => sum + (lower.includes(keyword) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score);

  const matched = scored.filter((item) => item.score > 0).map((item) => item.agent);
  const defaults = [agents.find((a) => a.id === "maya"), agents.find((a) => a.id === "alex"), agents.find((a) => a.id === "qa")].filter(Boolean) as Agent[];
  const team = Array.from(new Map([...matched, ...defaults].map((agent) => [agent.id, agent])).values()).slice(0, 5);
  const lead = team[0] ?? agents[0];
  const now = new Date().toISOString();
  const runId = `run_${Date.now()}`;

  const tasks: AgentTask[] = team.map((agent, index) => ({
    id: `task_${Date.now()}_${index}`,
    runId,
    agentId: agent.id,
    agent: agent.name,
    role: agent.role,
    department: agent.department,
    title: index === 0 ? `Lead: ${objective}` : `${agent.role} workstream`,
    instructions: instructionFor(agent, objective, index),
    status: "queued",
    risk: riskFor(agent, objective),
    order: index,
    createdAt: now,
    updatedAt: now,
  }));

  return { runId, lead, tasks };
}