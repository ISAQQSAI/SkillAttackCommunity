import { NextResponse } from "next/server";

import { requireRole } from "@/lib/server/auth";
import { unpublishSubmission } from "@/lib/server/report-submissions";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const viewer = await requireRole(["admin"]);
    const { id } = await params;
    const submission = await unpublishSubmission(id, viewer);
    return NextResponse.json({ submission });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not unpublish submission." },
      { status: 400 }
    );
  }
}
