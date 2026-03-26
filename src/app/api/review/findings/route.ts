import { NextResponse } from "next/server";

import { requireRole } from "@/lib/server/auth";
import { listReviewFindings } from "@/lib/server/store";

export async function GET(request: Request) {
  try {
    await requireRole(["admin"]);
    const { searchParams } = new URL(request.url);
    const findings = await listReviewFindings({
      status: searchParams.get("status") || undefined,
      vendor: searchParams.get("vendor") || undefined,
      vuln: searchParams.get("vuln") || undefined,
      dataset: searchParams.get("dataset") || undefined,
    });
    return NextResponse.json({ findings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load review queue." },
      { status: 403 }
    );
  }
}
