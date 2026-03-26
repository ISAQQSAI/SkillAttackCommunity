import { NextResponse } from "next/server";

import { LOCALE_COOKIE, isLocale } from "@/lib/i18n";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const locale = payload?.locale;
  if (!isLocale(locale)) {
    return NextResponse.json({ error: "Invalid locale." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, locale });
  response.cookies.set({
    name: LOCALE_COOKIE,
    value: locale,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
