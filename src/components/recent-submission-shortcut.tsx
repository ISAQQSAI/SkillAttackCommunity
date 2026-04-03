"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { actionButtonClass, InsetCard } from "@/components/page-chrome";
import type { Locale } from "@/lib/i18n";
import { LAST_SUBMISSION_STORAGE_KEY } from "@/lib/submission-receipt";

interface StoredReceipt {
  submissionId: string;
  trackingToken: string;
}

export function RecentSubmissionShortcut({
  locale,
}: {
  locale: Locale;
}) {
  const [receipt, setReceipt] = useState<StoredReceipt | null>(null);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(LAST_SUBMISSION_STORAGE_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as StoredReceipt;
      if (parsed.submissionId && parsed.trackingToken) {
        setReceipt(parsed);
      }
    } catch {
      window.sessionStorage.removeItem(LAST_SUBMISSION_STORAGE_KEY);
    }
  }, []);

  if (!receipt) {
    return null;
  }

  return (
    <InsetCard tone="tint" className="grid gap-3 text-sm">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
        {locale === "zh" ? "最近一次提交" : "Recent submission"}
      </div>
      <div className="leading-7 text-slate-700">
        {locale === "zh"
          ? "浏览器里保存着你最近一次的查询回执，可以直接继续查看进度。"
          : "Your browser still has the latest tracking receipt, so you can jump back into the status page."}
      </div>
      <div className="border border-slate-300 bg-white px-4 py-3 text-slate-700">
        {receipt.submissionId}
      </div>
      <Link
        href={`/reports?id=${encodeURIComponent(receipt.submissionId)}&token=${encodeURIComponent(receipt.trackingToken)}`}
        className={actionButtonClass("primary")}
      >
        {locale === "zh" ? "继续查看进度" : "Continue tracking"}
      </Link>
    </InsetCard>
  );
}
