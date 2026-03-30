import { NextResponse } from "next/server";

import { getUploadPreview } from "@/lib/server/report-submissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    if (!token) {
      throw new Error("Preview token is required.");
    }

    const preview = await getUploadPreview(id, token);
    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load upload preview." },
      { status: 400 }
    );
  }
}
