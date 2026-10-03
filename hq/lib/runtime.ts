import { getGitHubSnapshot, getGitHubTextFile } from "./github";
import { completeWithModel } from "./model";
import type { AgentTask, ArtifactKind, RunArtifact } from "./types";

function artifactKind(task: AgentTask): ArtifactKind {
  if (task.agentId === "noah") return "research";
  if (task.agentId === "qa") return "qa_report";
  if (task.department === "engineering") return "code_plan";
  if (task.department === "growth") return "launch_plan";
  if (task.department === "operations") return "ops_checklist";
  return "spec";
}

function bullets(lines: string[]) {
  return lines.map((line) => `- ${line}`).join("\n");
}

async function repoContext() {
  const github = await getGitHubSnapshot();
  if (!github.configured) return { github, packageJson: null, readme: null };
  const [packageJson, readme] = await Promise.all([getGitHubTextFile("package.json"), getGitHubTextFile("README.md")]);
  return { github, packageJson, readme };
}

function fallbackOutput(task: AgentTask, objective: string, context: Awaited<ReturnType<typeof repoContext>>) {
  const sections = [
    `# ${task.title}`,
    `**Objective:** ${objective}`,
    `**Owner:** ${task.agent} — ${task.role}`,
    `**Risk:** ${task.risk}`,
    "",
    "## Assignment",
    task.instructions,
    "",
  ];

  if (task.department === "engineering") {
    sections.push("## Repository context");
    if (!context.github.configured) {
      sections.push("GitHub is not configured yet. Set `GITHUB_TOKEN` and `LIFEOS_REPO` to enable live repository inspection.");
    } else if (context.github.error) {
      sections.push(`Repository inspection failed: ${context.github.error}`);
    } else {
      sections.push(bullets([
        `Repository: ${context.github.repo}`,
        `Default branch: ${context.github.defaultBranch}`,
        `Visibility: ${context.github.private ? "private" : "public"}`,
        `Open issues: ${context.github.openIssues ?? "unknown"}`,
        `Last push: ${context.github.pushedAt ?? "unknown"}`,
      ]));
      if (context.packageJson) {
        try {
          const pkg = JSON.parse(context.packageJson) as { dependencies?: Record<string, string> };
          const important = ["expo", "react-native", "expo-router", "@supabase/supabase-js"].filter((name) => pkg.dependencies?.[name]);
          if (important.length) sections.push("", `Detected app stack: ${important.map((name) => `${name}@${pkg.dependencies?.[name]}`).join(", ")}.`);
        } catch { /* ignore malformed package metadata */ }
      }
    }
    sections.push("", "## Engineering output", bullets([
      "Map the objective to the smallest coherent code change.",
      "Identify modules/files before modifying code.",
      "Create work on a dedicated branch, never directly on main.",
      "Add validation steps and hand off to QA before merge.",
    ]));
  } else if (task.agentId === "qa") {
    sections.push("## QA output", bullets([
      "Define happy-path acceptance tests.",
      "Define at least three failure/edge scenarios.",
      "Check regression risk against onboarding, auth, sync, and offline behavior when relevant.",
      "Require evidence before marking the run releasable.",
    ]));
  } else if (task.department === "product") {
    sections.push("## Product output", bullets([
      "State the user problem and target user.",
      "Define the smallest valuable scope.",
      "List explicit non-goals to constrain execution.",
      "Translate the outcome into measurable acceptance criteria.",
    ]));
  } else if (task.department === "growth") {
    sections.push("## Growth output", bullets([
      "Define audience and positioning.",
      "Choose one primary acquisition or launch channel.",
      "Draft one measurable experiment instead of a broad campaign.",
      "Specify success metric and stopping condition.",
    ]));
  } else {
    sections.push("## Operations output", bullets([
      "Identify approvals and external dependencies.",
      "Create a release/readiness checklist.",
      "Flag legal, privacy, cost, or operational risk.",
      "Assign a clear owner for every blocker.",
    ]));
  }

  sections.push("", "## Completion contract", bullets([
    "Output is attached to this run and reviewable by the founder.",
    "Consequential external actions remain behind an approval gate.",
  ]));
  return sections.join("\n");
}

export async function executeTask(task: AgentTask, objective: string): Promise<{ artifact: RunArtifact; needsApproval: boolean; usedModel: boolean }> {
  const now = new Date().toISOString();
  const context = task.department === "engineering" ? await repoContext() : { github: { configured: false }, packageJson: null, readme: null };

  const modelContext = task.department === "engineering" && context.github.configured
    ? `\nRepository: ${context.github.repo}\nDefault branch: ${context.github.defaultBranch}\npackage.json:\n${context.packageJson?.slice(0, 7000) ?? "unavailable"}\nREADME excerpt:\n${context.readme?.slice(0, 3500) ?? "unavailable"}`
    : "";

  let modelOutput: string | null = null;
  try {
    modelOutput = await completeWithModel([
      {
        role: "system",
        content: `You are ${task.agent}, the ${task.role} inside LifeOS HQ. Work as a scoped startup specialist. Produce a concrete, reviewable artifact. Do not claim an external action happened unless the supplied context proves it. For engineering work, do not propose direct changes to main; use a dedicated branch and founder approval for consequential actions.`,
      },
      {
        role: "user",
        content: `Company objective: ${objective}\n\nYour assignment: ${task.instructions}\nRisk level: ${task.risk}.${modelContext}\n\nReturn concise Markdown with decisions, deliverable, risks, and next handoff.`,
      },
    ]);
  } catch (error) {
    modelOutput = `> Model gateway failed; deterministic fallback used. ${error instanceof Error ? error.message : "Unknown model error"}\n\n${fallbackOutput(task, objective, context)}`;
  }

  const content = modelOutput || fallbackOutput(task, objective, context);
  return {
    artifact: {
      id: `artifact_${Date.now()}_${task.id}`,
      runId: task.runId,
      taskId: task.id,
      agentId: task.agentId,
      title: `${task.agent} — ${task.title}`,
      kind: artifactKind(task),
      content,
      createdAt: now,
    },
    needsApproval: task.risk !== "low" && task.department === "engineering",
    usedModel: Boolean(modelOutput && !modelOutput.startsWith("> Model gateway failed")),
  };
}