import { NextResponse } from "next/server";

import { getDatasetSnapshot } from "@/lib/server/store";

export async function GET() {
  const snapshot = await getDatasetSnapshot();
  return NextResponse.json({ snapshot });
}
