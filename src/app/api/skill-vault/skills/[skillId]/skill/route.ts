import { promises as fs } from "fs";
import { NextResponse } from "next/server";

import { getSkillVaultSkillArchive } from "@/lib/skill-vault";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const { skillId } = await params;
  const asset = await getSkillVaultSkillArchive(skillId);
  if (!asset) {
    return NextResponse.json({ error: "skill.zip not found." }, { status: 404 });
  }

  const buffer = await fs.readFile(asset.path);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${asset.fileName}"`,
    },
  });
}
