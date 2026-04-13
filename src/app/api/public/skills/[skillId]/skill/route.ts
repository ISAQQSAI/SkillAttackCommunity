import { NextResponse } from "next/server";

import { getPublicSkillArchiveDownload } from "@/lib/server/report-submissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const { skillId: rawSkillId } = await params;
  const skillId = decodeURIComponent(rawSkillId);
  const archive = await getPublicSkillArchiveDownload(skillId);

  if (!archive) {
    return NextResponse.json({ error: "skill.zip not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(archive.buffer), {
    headers: {
      "Content-Type": archive.contentType,
      "Content-Disposition": `attachment; filename="${archive.fileName}"`,
    },
  });
}
