import { NextResponse } from "next/server";

import { requireRole } from "@/lib/server/auth";
import { unpublishFinding } from "@/lib/server/store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const viewer = await requireRole(["admin"]);
    const finding = await unpublishFinding(id, viewer);
    return NextResponse.json({ finding });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not unpublish finding." },
      { status: 400 }
    );
  }
}
