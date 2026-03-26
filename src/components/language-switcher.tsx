"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getDictionary, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
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
    <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-2 py-2 text-xs">
      <span className="px-2 uppercase tracking-[0.18em] text-slate-500">{dict.shell.language}</span>
      {(["en", "zh"] as const).map((item) => {
        const label = item === "en" ? dict.shell.localeEn : dict.shell.localeZh;
        return (
          <button
            key={item}
            type="button"
            onClick={() => switchLocale(item)}
            disabled={Boolean(working)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              locale === item ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"
            } disabled:opacity-60`}
          >
            {working === item ? dict.shell.switching : label}
          </button>
        );
      })}
    </div>
  );
}
