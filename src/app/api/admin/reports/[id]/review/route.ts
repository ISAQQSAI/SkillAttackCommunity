import { NextResponse } from "next/server";

import { requireRole } from "@/lib/server/auth";
import { reviewSubmission } from "@/lib/server/report-submissions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const viewer = await requireRole(["admin"]);
    const { id } = await params;
    const payload = await request.json();
    const submission = await reviewSubmission(id, viewer, payload);
    return NextResponse.json({ submission });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not review submission." },
      { status: 400 }
    );
  }
}
