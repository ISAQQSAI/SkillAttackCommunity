"use client";

import { useState } from "react";

import { actionButtonClass, InsetCard } from "@/components/page-chrome";
import type { Locale } from "@/lib/i18n";

interface ReceiptField {
  label: string;
  value: string;
}

function normalizeFilenamePart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "true");
  input.style.position = "absolute";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
}

export function ReceiptPanel({
  locale,
  title,
  description,
  fields,
  filenamePrefix = "skillatlas-receipt",
}: {
  locale: Locale;
  title: string;
  description: string;
  fields: ReceiptField[];
  filenamePrefix?: string;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  const copy =
    locale === "zh"
      ? {
          copy: "复制",
          copied: "已复制",
          copyAll: "复制整份回执",
          download: "下载回执",
          copyFailed: "复制失败，请手动保存。",
        }
      : {
          copy: "Copy",
          copied: "Copied",
          copyAll: "Copy full receipt",
          download: "Download receipt",
          copyFailed: "Copy failed. Save the values manually.",
        };

  const receiptText = fields.map((field) => `${field.label}: ${field.value}`).join("\n");

  async function handleCopy(label: string, value: string) {
    try {
      setCopyError(null);
      await copyText(value);
      setCopiedField(label);
      window.setTimeout(() => setCopiedField((current) => (current === label ? null : current)), 1600);
    } catch {
      setCopyError(copy.copyFailed);
    }
  }

  function handleDownload() {
    const blob = new Blob([receiptText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const suffix = normalizeFilenamePart(fields[0]?.value || "receipt");
    link.href = url;
    link.download = `${normalizeFilenamePart(filenamePrefix)}-${suffix || "receipt"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <InsetCard className="grid gap-4 p-5">
      <div className="grid gap-1.5">
        <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">{title}</h3>
        <p className="text-sm leading-7 text-slate-600">{description}</p>
      </div>

      <div className="grid gap-3">
        {fields.map((field) => (
          <InsetCard key={field.label} tone="white" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{field.label}</div>
              <div className="mt-2 break-all text-sm font-medium text-slate-800">{field.value}</div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(field.label, field.value)}
              className={actionButtonClass("ghost")}
            >
              {copiedField === field.label ? copy.copied : copy.copy}
            </button>
          </InsetCard>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => handleCopy("all", receiptText)} className={actionButtonClass("secondary")}>
          {copiedField === "all" ? copy.copied : copy.copyAll}
        </button>
        <button type="button" onClick={handleDownload} className={actionButtonClass("secondary")}>
          {copy.download}
        </button>
      </div>

      {copyError ? (
        <div className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {copyError}
        </div>
      ) : null}
    </InsetCard>
  );
}
