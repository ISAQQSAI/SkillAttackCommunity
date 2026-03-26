import { NextResponse } from "next/server";

import { requireViewer } from "@/lib/server/auth";
import { submitFinding } from "@/lib/server/store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const viewer = await requireViewer();
    const finding = await submitFinding(id, viewer);
    return NextResponse.json({ finding });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not submit report." },
      { status: 400 }
    );
  }
}
