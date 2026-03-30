import { NextResponse } from "next/server";

import { requireRole } from "@/lib/server/auth";
import { getAdminSubmission } from "@/lib/server/report-submissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["admin"]);
    const { id } = await params;
    const submission = await getAdminSubmission(id);
    return NextResponse.json({ submission });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load admin report." },
      { status: 400 }
    );
  }
}
