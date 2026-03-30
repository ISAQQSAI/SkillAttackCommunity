import { NextResponse } from "next/server";

import { listPublicCases } from "@/lib/server/report-submissions";

export async function GET() {
  const cases = await listPublicCases();
  return NextResponse.json({ cases });
}
