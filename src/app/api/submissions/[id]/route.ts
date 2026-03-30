import { NextResponse } from "next/server";

import { getSubmissionStatus } from "@/lib/server/report-submissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    if (!token) {
      throw new Error("Tracking token is required.");
    }

    const submission = await getSubmissionStatus(id, token);
    return NextResponse.json(submission);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load submission status." },
      { status: 400 }
    );
  }
}
