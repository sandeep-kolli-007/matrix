import { promises as fs } from "node:fs";
import path from "node:path";
import type { HqState } from "./types";

const stateDir = path.join(process.cwd(), ".lifeos-hq");
const stateFile = path.join(stateDir, "state.json");

const emptyState = (): HqState => ({
  version: 1,
  runs: [],
  tasks: [],
  artifacts: [],
  approvals: [],
  events: [],
});

async function ensureStore() {
  await fs.mkdir(stateDir, { recursive: true });
  try {
    await fs.access(stateFile);
  } catch {
    await fs.writeFile(stateFile, JSON.stringify(emptyState(), null, 2), "utf8");
  }
}

export async function readState(): Promise<HqState> {
  await ensureStore();
  try {
    const raw = await fs.readFile(stateFile, "utf8");
    return JSON.parse(raw) as HqState;
  } catch {
    const state = emptyState();
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2), "utf8");
    return state;
  }
}

export async function writeState(state: HqState): Promise<void> {
  await ensureStore();
  const temp = `${stateFile}.tmp`;
  await fs.writeFile(temp, JSON.stringify(state, null, 2), "utf8");
  await fs.rename(temp, stateFile);
}

export async function updateState<T>(mutator: (state: HqState) => T | Promise<T>): Promise<T> {
  const state = await readState();
  const result = await mutator(state);
  await writeState(state);
  return result;
}