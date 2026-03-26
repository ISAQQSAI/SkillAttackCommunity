import { NextResponse } from "next/server";

import { getPublicFindingBySlug } from "@/lib/server/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const finding = await getPublicFindingBySlug(slug);
  if (!finding) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ finding });
}
