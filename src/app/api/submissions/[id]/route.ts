import { NextResponse } from "next/server";

import { getSubmissionStatus } from "@/lib/server/report-submissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const submission = await getSubmissionStatus(id);
    return NextResponse.json(submission);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load submission status." },
      { status: 400 }
    );
  }
}
