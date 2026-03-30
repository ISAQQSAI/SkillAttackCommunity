import { NextResponse } from "next/server";

import { getPublicCaseBySlug } from "@/lib/server/report-submissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const item = await getPublicCaseBySlug(slug);
  if (!item) {
    return NextResponse.json({ error: "Public case not found." }, { status: 404 });
  }
  return NextResponse.json({ case: item });
}
