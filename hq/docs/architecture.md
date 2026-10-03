# LifeOS HQ — architecture

## Product boundary
LifeOS HQ is a separate internal product that operates the LifeOS startup. MATRIX (`sandeep-kolli-007/matrix`) remains the consumer LifeOS product repository. HQ is the control plane and should not be embedded into the consumer app.

## Core principle
The UI is an observability and control plane. Agents are durable identities with scoped context, tools, memory boundaries, and autonomy. Consequential actions are explicit state transitions, not hidden side effects.

## Core domains
- **Missions** — founder objectives and milestones.
- **Agents** — durable identities with role, tools, memory scope, and autonomy.
- **Runs** — one execution instance for an objective.
- **Tasks** — ordered work units assigned to agents.
- **Artifacts** — specs, research, code plans, QA reports, launch assets.
- **Approvals** — founder gates for consequential actions.
- **Events** — immutable-style execution log used for observability.

## Execution pipeline

```text
Founder objective
      ↓
Chief of Staff planner
      ↓
Persistent run + ordered tasks
      ↓
Specialist agent runtime
      ↓
Model gateway OR deterministic fallback
      ↓
Reviewable artifact
      ↓
Risk policy
   ↙      ↘
low      medium/high consequence
 ↓              ↓
complete     founder approval
                 ↓
          scoped external action
```

## Current persistence
Development uses `.lifeos-hq/state.json` through a small repository abstraction. It persists runs, tasks, artifacts, approvals, and events across local restarts.

This store is deliberately replaceable. A production deployment should move persistence to Supabase/Postgres because serverless filesystems are not durable application storage.

## Model provider
HQ is provider-neutral. `HQ_MODEL_BASE_URL`, `HQ_MODEL_API_KEY`, and `HQ_MODEL_NAME` point the runtime at an OpenAI-compatible chat-completions gateway. When no model is configured, the same state machine runs with deterministic fallback artifacts.

This means orchestration, permissions, storage, and auditability are not coupled to an LLM vendor.

## GitHub boundary
Target product repository: `sandeep-kolli-007/matrix`.

Current GitHub capabilities:
1. Read repository metadata.
2. Read `package.json` and `README.md` as engineering context.
3. Prepare a dedicated work branch action.
4. Require founder approval.
5. Create the branch only after approval when credentials are configured.

Current non-capabilities by design:
- No direct commit to `main`.
- No merge.
- No production deployment.
- No database migration.
- No unreviewed code mutation.

## MATRIX context detected during development
The connected MATRIX repository is a private Expo/React Native app on `main`, using Expo Router, React Native, and Supabase. HQ's engineering runtime is designed to pull that context dynamically rather than hard-code product implementation assumptions.

## Autonomy levels
0. Suggest only.
1. Draft artifacts.
2. Execute in a sandbox / create reviewable work.
3. Prepare consequential external actions but require founder approval.
4. Autonomous low-risk execution under explicit policy.

## Next implementation slice
Phase 3 should add a code-workspace executor:

1. Fetch a bounded repository file set based on an engineering task.
2. Ask the engineering agent for a structured patch proposal.
3. Validate that every changed path is allowed.
4. Create/update files only on the approved HQ branch.
5. Run lint/type/test commands in an isolated workspace.
6. Hand evidence to Iris (QA).
7. Create a draft PR.
8. Keep PR merge behind founder approval.

That is the point where HQ moves from *planning the company* to *shipping reviewable code for the company*.