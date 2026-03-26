import { NextResponse } from "next/server";

import { getViewer } from "@/lib/server/auth";
import { getArtifactById } from "@/lib/server/store";
import { readStoredArtifact } from "@/lib/server/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ findingId: string; artifactId: string }> }
) {
  const { findingId, artifactId } = await params;
  const data = await getArtifactById(findingId, artifactId);
  if (!data) {
    return NextResponse.json({ error: "Artifact not found." }, { status: 404 });
  }

  const viewer = await getViewer();
  const publicAllowed = Boolean(data.published && data.artifact.publicSafe);
  const internalAllowed = Boolean(viewer && (viewer.role === "reviewer" || viewer.role === "admin" || data.finding.reporterId === viewer.id));

  if (!publicAllowed && !internalAllowed) {
    return NextResponse.json({ error: "Artifact is not public." }, { status: 403 });
  }

  const buffer = await readStoredArtifact(data.artifact.storagePath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": data.artifact.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${data.artifact.originalName}"`,
    },
  });
}
