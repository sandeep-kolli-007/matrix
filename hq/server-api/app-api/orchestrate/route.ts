import { NextResponse } from "next/server";
import { createRun, HqEngineError } from "@/lib/engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { objective?: string };
    const result = await createRun(body.objective ?? "");
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof HqEngineError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Could not plan objective";
    return NextResponse.json({ error: message }, { status });
  }
}