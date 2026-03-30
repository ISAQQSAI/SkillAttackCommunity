import { NextResponse } from "next/server";

import { submitUploadPreview } from "@/lib/server/report-submissions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await request.json();
    const token = String(payload?.previewToken || "");
    if (!token) {
      throw new Error("previewToken is required.");
    }

    const submitted = await submitUploadPreview(id, token, payload);
    return NextResponse.json(submitted);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not submit upload preview." },
      { status: 400 }
    );
  }
}
