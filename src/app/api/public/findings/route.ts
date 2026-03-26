import { NextResponse } from "next/server";

import { listPublicFindingViews } from "@/lib/server/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const findings = await listPublicFindingViews({
    q: searchParams.get("q") || undefined,
    skill: searchParams.get("skill") || undefined,
    skillUrl: searchParams.get("skillUrl") || undefined,
    model: searchParams.get("model") || undefined,
    dataset: searchParams.get("dataset") || undefined,
    vuln: searchParams.get("vuln") || undefined,
    verification: searchParams.get("verification") || undefined,
  });
  return NextResponse.json({ findings });
}
