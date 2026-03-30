import { NextResponse } from "next/server";

import { requireRole } from "@/lib/server/auth";
import { listAdminSubmissions } from "@/lib/server/report-submissions";

export async function GET() {
  try {
    await requireRole(["admin"]);
    const submissions = await listAdminSubmissions();
    return NextResponse.json({ submissions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load admin reports." },
      { status: 400 }
    );
  }
}
