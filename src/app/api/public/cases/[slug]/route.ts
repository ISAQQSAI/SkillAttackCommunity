import { NextResponse } from "next/server";

import { getPublicSurfaceBySlug } from "@/lib/server/public-skills";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const item = await getPublicSurfaceBySlug(slug);
  if (!item) {
    return NextResponse.json({ error: "Public case not found." }, { status: 404 });
  }
  return NextResponse.json({ case: item });
}
