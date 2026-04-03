import { NextResponse } from "next/server";

import { listPublicVulnerabilities } from "@/lib/server/public-skills";

export async function GET() {
  const cases = await listPublicVulnerabilities();
  return NextResponse.json({ cases });
}
