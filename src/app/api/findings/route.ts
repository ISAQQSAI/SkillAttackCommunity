import { NextResponse } from "next/server";

import { requireViewer } from "@/lib/server/auth";
import { saveDraft } from "@/lib/server/store";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const payload = await request.json();
    const finding = await saveDraft(payload, viewer);
    return NextResponse.json({ finding });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save report." },
      { status: 400 }
    );
  }
}
