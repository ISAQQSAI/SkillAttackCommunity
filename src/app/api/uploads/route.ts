import { NextResponse } from "next/server";

import { createUploadPreview } from "@/lib/server/report-submissions";

function pickFirstFile(formData: FormData) {
  const direct = formData.get("bundle");
  if (direct instanceof File && direct.size > 0) {
    return direct;
  }

  const fallback = formData.get("file");
  if (fallback instanceof File && fallback.size > 0) {
    return fallback;
  }

  return formData
    .values()
    .find((value): value is File => value instanceof File && value.size > 0);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = pickFirstFile(formData);
    if (!file) {
      throw new Error("Missing report bundle upload.");
    }

    const source = String(formData.get("source") || "web") === "api" ? "api" : "web";
    const result = await createUploadPreview(file, source);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create upload preview." },
      { status: 400 }
    );
  }
}
