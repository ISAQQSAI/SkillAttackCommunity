import { NextResponse } from "next/server";

import { requireViewer } from "@/lib/server/auth";
import { attachArtifacts } from "@/lib/server/store";
import { saveUploadedArtifacts } from "@/lib/server/storage";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const viewer = await requireViewer();
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (!files.length) {
      throw new Error("No files were uploaded.");
    }

    const publicSafe = String(formData.get("publicSafe") || "false") === "true";
    const saved = await saveUploadedArtifacts(id, files, publicSafe);
    const bundle = await attachArtifacts(id, viewer, saved);

    return NextResponse.json({ bundle });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not upload artifacts." },
      { status: 400 }
    );
  }
}
