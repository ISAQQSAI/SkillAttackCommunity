"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";

import type { Locale } from "@/lib/i18n";

function previewClass(monospace = false) {
  return `${
    monospace ? "font-mono text-[13px] leading-6" : "text-sm leading-7"
  } overflow-hidden whitespace-pre-wrap break-words text-slate-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]`;
}

function contentClass(monospace = false) {
  return `${monospace ? "font-mono text-[13px] leading-6" : "text-sm leading-7"} whitespace-pre-wrap break-words text-slate-700`;
}

export function AuditEntryCard({
  locale,
  className,
  badges,
  title,
  meta,
  content,
  monospace = false,
}: {
  locale: Locale;
  className: string;
  badges: Array<{ label: string; className: string }>;
  title: string;
  meta?: string;
  content: string;
  monospace?: boolean;
}) {
  const normalized = String(content || "").trim() || "-";
  const contentRef = useRef<HTMLDivElement>(null);
  const [canCollapse, setCanCollapse] = useState(false);
  const [open, setOpen] = useState(true);

  useLayoutEffect(() => {
    const element = contentRef.current;

    if (!element || normalized === "-") {
      setCanCollapse(false);
      setOpen(true);
      return;
    }

    const lineHeight = Number.parseFloat(window.getComputedStyle(element).lineHeight);
    const fourLineHeight = Number.isFinite(lineHeight) ? lineHeight * 4 : 0;
    const shouldCollapse = fourLineHeight > 0 && element.scrollHeight > fourLineHeight + 1;

    setCanCollapse(shouldCollapse);
    setOpen(!shouldCollapse);
  }, [monospace, normalized]);

  function toggle() {
    if (!canCollapse) {
      return;
    }
    setOpen((value) => !value);
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!canCollapse) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("a,button,input,textarea,select")) {
      return;
    }

    const selected = typeof window !== "undefined" ? window.getSelection()?.toString().trim() : "";
    if (selected) {
      return;
    }

    toggle();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!canCollapse) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  }

  return (
    <div
      role={canCollapse ? "button" : undefined}
      tabIndex={canCollapse ? 0 : undefined}
      aria-expanded={canCollapse ? open : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`${className} min-w-0 ${canCollapse ? "cursor-pointer transition hover:border-slate-300 hover:shadow-[0_10px_22px_rgba(15,23,42,0.04)]" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {badges.map((badge) => (
            <span key={`${badge.label}-${badge.className}`} className={badge.className}>
              {badge.label}
            </span>
          ))}
        </div>
        {canCollapse ? (
          <span
            aria-hidden="true"
            title={locale === "zh" ? "点击卡片折叠或展开" : "Click card to collapse or expand"}
            className={`inline-flex h-5 w-5 shrink-0 items-center justify-center text-sm leading-none text-slate-300 transition ${open ? "rotate-45 text-slate-500" : "text-slate-300"}`}
          >
            +
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid gap-1.5">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {meta ? <div className="text-xs text-slate-500">{meta}</div> : null}
      </div>

      <div className="mt-3">
        <div ref={contentRef} className={open ? contentClass(monospace) : previewClass(monospace)}>
          {normalized}
        </div>
      </div>
    </div>
  );
}
