import { NextResponse } from "next/server";
import { HqEngineError, resolveFounderApproval } from "@/lib/engine";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ approvalId: string }> }) {
  try {
    const { approvalId } = await context.params;
    const body = (await request.json()) as { decision?: "approve" | "reject" };
    if (body.decision !== "approve" && body.decision !== "reject") {
      throw new HqEngineError("decision must be approve or reject", 400);
    }
    return NextResponse.json(await resolveFounderApproval(approvalId, body.decision));
  } catch (error) {
    const status = error instanceof HqEngineError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Approval failed";
    return NextResponse.json({ error: message }, { status });
  }
}