import { NextResponse } from "next/server";

import { requireRole } from "@/lib/server/auth";
import { transitionFindingStatus } from "@/lib/server/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const viewer = await requireRole(["admin"]);
    const payload = await request.json();
    const finding = await transitionFindingStatus(id, viewer, payload);
    return NextResponse.json({ finding });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update finding status." },
      { status: 400 }
    );
  }
}
