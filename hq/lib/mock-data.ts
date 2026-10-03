import type { Activity, Agent, Approval, Mission } from "./types";

export const agents: Agent[] = [
  { id: "maya", name: "Maya", role: "Product Lead", department: "product", initials: "MY", status: "working", currentTask: "Refining LifeOS beta scope", tools: ["Figma", "GitHub", "Analytics"], autonomy: 2, skills: ["Product strategy", "UX", "Roadmaps"] },
  { id: "noah", name: "Noah", role: "UX Researcher", department: "product", initials: "NO", status: "reviewing", currentTask: "Reviewing onboarding friction", tools: ["Analytics", "Docs"], autonomy: 1, skills: ["Research", "User journeys", "Competitive analysis"] },
  { id: "alex", name: "Alex", role: "Engineering Lead", department: "engineering", initials: "AL", status: "reviewing", currentTask: "Reviewing agent architecture", tools: ["GitHub", "Supabase", "Vercel"], autonomy: 3, skills: ["Architecture", "React Native", "Systems"] },
  { id: "sam", name: "Sam", role: "Mobile Engineer", department: "engineering", initials: "SA", status: "working", currentTask: "Building universal quick add", tools: ["GitHub", "React Native"], autonomy: 2, skills: ["React Native", "TypeScript", "Offline-first"] },
  { id: "ria", name: "Ria", role: "Backend Engineer", department: "engineering", initials: "RI", status: "working", currentTask: "Hardening LifeGraph APIs", tools: ["Supabase", "Postgres", "GitHub"], autonomy: 2, skills: ["Postgres", "Edge functions", "Auth"] },
  { id: "qa", name: "Iris", role: "QA Engineer", department: "engineering", initials: "IR", status: "idle", currentTask: "Waiting for next candidate build", tools: ["Playwright", "GitHub"], autonomy: 2, skills: ["Regression", "E2E", "Release gates"] },
  { id: "ava", name: "Ava", role: "Growth Lead", department: "growth", initials: "AV", status: "working", currentTask: "Drafting beta launch narrative", tools: ["App Store", "Analytics", "Docs"], autonomy: 2, skills: ["Positioning", "ASO", "Launches"] },
  { id: "leo", name: "Leo", role: "Content & Social", department: "growth", initials: "LE", status: "idle", currentTask: "Awaiting launch assets", tools: ["Canva", "Social"], autonomy: 1, skills: ["Content", "Social", "Creative briefs"] },
  { id: "nina", name: "Nina", role: "Operations", department: "operations", initials: "NI", status: "working", currentTask: "Preparing beta readiness checklist", tools: ["Docs", "Calendar", "Email"], autonomy: 2, skills: ["Operations", "Compliance", "Planning"] },
];

export const missions: Mission[] = [
  { id: "m1", title: "LifeOS private beta", description: "Reach a stable, instrumented beta build ready for the first external users.", priority: "P0", progress: 68, status: "active", owner: "Maya" },
  { id: "m2", title: "LifeGraph foundation", description: "Stabilize entity graph, sync semantics and core API contracts.", priority: "P0", progress: 82, status: "active", owner: "Alex" },
  { id: "m3", title: "Launch system", description: "Prepare landing page, ASO, analytics and onboarding funnel.", priority: "P1", progress: 34, status: "active", owner: "Ava" },
];

export const activities: Activity[] = [
  { id: "a1", time: "21:04", agent: "Alex", verb: "reviewed", detail: "agent execution boundary proposal", kind: "code" },
  { id: "a2", time: "21:02", agent: "Maya", verb: "updated", detail: "beta scope with 3 P0 cuts", kind: "research" },
  { id: "a3", time: "20:58", agent: "Sam", verb: "implemented", detail: "quick-add entity selector", kind: "code" },
  { id: "a4", time: "20:52", agent: "Iris", verb: "completed", detail: "smoke tests for onboarding flow", kind: "qa" },
  { id: "a5", time: "20:46", agent: "Ava", verb: "drafted", detail: "private beta launch positioning", kind: "design" },
];

export const approvals: Approval[] = [
  { id: "ap1", title: "Merge PR #148", detail: "Universal Quick Add — 12 files changed", risk: "medium", requestedBy: "Alex", status: "pending", action: { type: "none" }, createdAt: new Date().toISOString() },
  { id: "ap2", title: "Apply database migration", detail: "Adds agent_run and artifact tables", risk: "high", requestedBy: "Ria", status: "pending", action: { type: "none" }, createdAt: new Date().toISOString() },
];