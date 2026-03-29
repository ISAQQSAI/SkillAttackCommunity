"use client";

import { useEffect, useState } from "react";

interface RawReportModalProps {
  triggerLabel: string;
  panelLabel: string;
  closeLabel: string;
  loadingLabel: string;
  errorLabel: string;
  openInNewTabLabel: string;
  title: string;
  subtitle?: string;
  reportUrl: string;
}

export function RawReportModal({
  triggerLabel,
  panelLabel,
  closeLabel,
  loadingLabel,
  errorLabel,
  openInNewTabLabel,
  title,
  subtitle,
  reportUrl,
}: RawReportModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");

    void (async () => {
      try {
        const response = await fetch(reportUrl, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("Request failed");
        }
        const rawText = await response.text();
        let formatted = rawText;
        try {
          formatted = JSON.stringify(JSON.parse(rawText), null, 2);
        } catch {
          // Keep raw text if the payload is already formatted or not strict JSON.
        }
        setContent(formatted);
      } catch (fetchError) {
        if (!(fetchError instanceof DOMException && fetchError.name === "AbortError")) {
          setError(errorLabel);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [errorLabel, open, reportUrl]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5"
      >
        {triggerLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/28 p-4 backdrop-blur-sm sm:p-6">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-label={panelLabel}
            className="relative z-10 flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-black/10 bg-[radial-gradient(circle_at_top_left,_rgba(203,255,122,0.08),_transparent_18%),radial-gradient(circle_at_top_right,_rgba(255,104,71,0.12),_transparent_18%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.96))] shadow-[0_40px_140px_rgba(15,23,42,0.22)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/8 px-5 py-5 sm:px-6">
              <div className="min-w-0">
                <div className="w-fit rounded-full border border-black/8 bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {panelLabel}
                </div>
                <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{title}</h3>
                {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5"
                >
                  {openInNewTabLabel}
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  {closeLabel}
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-5 py-5 sm:px-6">
              {loading ? (
                <div className="rounded-[1.5rem] border border-black/8 bg-white/80 px-5 py-6 text-sm text-slate-600">
                  {loadingLabel}
                </div>
              ) : error ? (
                <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-900">
                  {error}
                </div>
              ) : (
                <pre className="overflow-auto rounded-[1.6rem] border border-black/8 bg-white p-5 text-xs leading-6 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:text-[13px]">
                  <code>{content}</code>
                </pre>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
