type GitHubRepoSnapshot = {
  configured: boolean;
  repo?: string;
  defaultBranch?: string;
  private?: boolean;
  openIssues?: number;
  pushedAt?: string | null;
  error?: string;
};

function config() {
  const token = process.env.GITHUB_TOKEN?.trim();
  const repo = process.env.LIFEOS_REPO?.trim();
  return { token, repo, configured: Boolean(token && repo) };
}

async function gh(path: string, init?: RequestInit) {
  const { token } = config();
  if (!token) throw new Error("GITHUB_TOKEN is not configured");
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub ${response.status}: ${body.slice(0, 280)}`);
  }
  return response.json();
}

export async function getGitHubSnapshot(): Promise<GitHubRepoSnapshot> {
  const { repo, configured } = config();
  if (!configured || !repo) return { configured: false, repo };
  try {
    const data = await gh(`/repos/${repo}`) as {
      default_branch: string;
      private: boolean;
      open_issues_count: number;
      pushed_at: string | null;
    };
    return {
      configured: true,
      repo,
      defaultBranch: data.default_branch,
      private: data.private,
      openIssues: data.open_issues_count,
      pushedAt: data.pushed_at,
    };
  } catch (error) {
    return { configured: true, repo, error: error instanceof Error ? error.message : "Unknown GitHub error" };
  }
}

export async function getGitHubTextFile(path: string): Promise<string | null> {
  const { repo, configured } = config();
  if (!configured || !repo) return null;
  try {
    const file = await gh(`/repos/${repo}/contents/${path}`) as { content?: string; encoding?: string };
    if (!file.content || file.encoding !== "base64") return null;
    return Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf8");
  } catch {
    return null;
  }
}

export async function createBranch(branchName: string) {
  const { repo, configured } = config();
  if (!configured || !repo) return { mode: "dry-run" as const, branchName, repo: repo ?? "unconfigured" };
  const repository = await gh(`/repos/${repo}`) as { default_branch: string };
  const branch = await gh(`/repos/${repo}/git/ref/heads/${encodeURIComponent(repository.default_branch)}`) as { object: { sha: string } };
  await gh(`/repos/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: branch.object.sha }),
  });
  return { mode: "live" as const, branchName, repo };
}

export async function createIssue(title: string, body: string) {
  const { repo, configured } = config();
  if (!configured || !repo) return { mode: "dry-run" as const, title, repo: repo ?? "unconfigured" };
  const issue = await gh(`/repos/${repo}/issues`, {
    method: "POST",
    body: JSON.stringify({ title, body }),
  }) as { number: number; html_url: string };
  return { mode: "live" as const, title, repo, number: issue.number, url: issue.html_url };
}