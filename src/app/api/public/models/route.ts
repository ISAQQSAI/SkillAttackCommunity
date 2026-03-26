import { NextResponse } from "next/server";

import { getModelSnapshot } from "@/lib/server/store";

export async function GET() {
  const snapshot = await getModelSnapshot();
  return NextResponse.json({ snapshot });
}
