import { promises as fs } from "fs";
import { NextResponse } from "next/server";

import { getSkillVaultReportAsset } from "@/lib/skill-vault";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ skillId: string; reportName: string }> }
) {
  const { skillId, reportName } = await params;
  const asset = await getSkillVaultReportAsset(skillId, reportName);
  if (!asset) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const buffer = await fs.readFile(asset.path);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `inline; filename="${asset.fileName}"`,
    },
  });
}
