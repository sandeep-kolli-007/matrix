import { NextResponse } from "next/server";
import { getRuntimeSnapshot } from "@/lib/engine";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getRuntimeSnapshot());
}