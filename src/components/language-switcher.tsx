"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getDictionary, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({
  locale,
  shape = "square",
}: {
  locale: Locale;
  shape?: "pill" | "square";
}) {
  const router = useRouter();
  const [working, setWorking] = useState<Locale | null>(null);
  const dict = getDictionary(locale);

  async function switchLocale(nextLocale: Locale) {
    if (nextLocale === locale) {
      return;
    }
    setWorking(nextLocale);
    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });
      router.refresh();
    } finally {
      setWorking(null);
    }
  }

  return (
    <div
      className={`flex items-center gap-2 border border-slate-200 bg-[rgba(247,251,255,0.92)] px-2 py-2 text-xs shadow-[0_12px_24px_rgba(15,23,42,0.04)] ${
        shape === "square"
          ? "rounded-none shadow-none"
          : "rounded-none shadow-none"
      }`}
    >
      {(["en", "zh"] as const).map((item) => {
        const label = item === "en" ? dict.shell.localeEn : dict.shell.localeZh;
        return (
          <button
            key={item}
            type="button"
            onClick={() => switchLocale(item)}
            disabled={Boolean(working)}
            className={`${shape === "square" ? "rounded-none" : "rounded-none"} px-3 py-1.5 text-sm font-medium transition ${
              locale === item
                ? shape === "square"
                  ? "bg-[#11284e] text-white !text-white hover:!text-white [&_*]:!text-white"
                  : "bg-[#11284e] text-white !text-white hover:!text-white [&_*]:!text-white"
                : "text-slate-700 hover:bg-[#f3f7fd]"
            } disabled:opacity-60`}
            style={locale === item ? { color: "#ffffff" } : undefined}
          >
            {working === item ? dict.shell.switching : label}
          </button>
        );
      })}
    </div>
  );
}
