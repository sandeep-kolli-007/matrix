import { NextResponse } from "next/server";
import { executeNextTask, HqEngineError } from "@/lib/engine";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await context.params;
    return NextResponse.json(await executeNextTask(runId));
  } catch (error) {
    const status = error instanceof HqEngineError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Execution failed";
    return NextResponse.json({ error: message }, { status });
  }
}