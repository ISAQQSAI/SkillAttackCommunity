import { InsetCard } from "@/components/page-chrome";
import type { Locale } from "@/lib/i18n";

export interface TrajectoryTimelineStep {
  stepIndex: number;
  relativeMs?: number;
  type: string;
  tool?: string;
  status?: "ok" | "error";
  summary: string;
}

function labelForType(locale: Locale, type: string, tool?: string) {
  const normalized = String(type || "").trim().toLowerCase();

  if (locale === "zh") {
    if (normalized === "assistant_message") {
      return "Agent 响应";
    }
    if (normalized === "tool_call") {
      return tool ? `调用工具 · ${tool}` : "调用工具";
    }
    if (normalized === "tool_result") {
      return tool ? `工具结果 · ${tool}` : "工具结果";
    }
    return "轨迹步骤";
  }

  if (normalized === "assistant_message") {
    return "Agent message";
  }
  if (normalized === "tool_call") {
    return tool ? `Tool call · ${tool}` : "Tool call";
  }
  if (normalized === "tool_result") {
    return tool ? `Tool result · ${tool}` : "Tool result";
  }
  return "Trace step";
}

function toneForStep(step: TrajectoryTimelineStep) {
  if (step.type === "assistant_message") {
    return {
      dot: "bg-sky-600 text-white",
      chip: "bg-sky-100 text-sky-800",
    };
  }
  if (step.type === "tool_call") {
    return {
      dot: "bg-indigo-600 text-white",
      chip: "bg-indigo-100 text-indigo-800",
    };
  }
  if (step.type === "tool_result" && step.status === "error") {
    return {
      dot: "bg-rose-600 text-white",
      chip: "bg-rose-100 text-rose-800",
    };
  }
  if (step.type === "tool_result") {
    return {
      dot: "bg-emerald-600 text-white",
      chip: "bg-emerald-100 text-emerald-800",
    };
  }
  return {
    dot: "bg-slate-700 text-white",
    chip: "bg-slate-100 text-slate-700",
  };
}

function formatRelative(locale: Locale, value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return locale === "zh" ? "顺序步骤" : "ordered step";
  }

  if (value < 1000) {
    return locale === "zh" ? `${value} ms` : `${value} ms`;
  }

  const seconds = value / 1000;
  if (seconds < 60) {
    return locale === "zh" ? `${seconds.toFixed(1)} s` : `${seconds.toFixed(1)} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return locale === "zh"
    ? `${minutes} 分 ${remain.toFixed(1)} 秒`
    : `${minutes}m ${remain.toFixed(1)}s`;
}

export function TrajectoryTimeline({
  locale,
  steps,
  title,
  compact = false,
}: {
  locale: Locale;
  steps: TrajectoryTimelineStep[];
  title?: string;
  compact?: boolean;
}) {
  if (!steps.length) {
    return null;
  }

  return (
    <div className="grid gap-3">
      {title ? (
        <div className={compact ? "text-sm font-semibold text-slate-900" : "text-lg font-semibold text-slate-950"}>
          {title}
        </div>
      ) : null}

      <div className="grid gap-3">
        {steps.map((step, index) => {
          const tone = toneForStep(step);
          return (
            <div key={`${step.stepIndex}-${index}`} className="grid grid-cols-[auto_1fr] gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold tracking-[0.14em] ${tone.dot}`}
                >
                  {compact ? index + 1 : String(step.stepIndex).padStart(2, "0")}
                </div>
                {index < steps.length - 1 ? (
                  <div className="mt-2 h-full w-px min-h-7 bg-[linear-gradient(180deg,_rgba(148,163,184,0.8),_rgba(226,232,240,0.2))]" />
                ) : null}
              </div>
              <InsetCard tone={step.status === "error" ? "tint" : "white"} className={compact ? "p-3.5" : "p-4"}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${tone.chip}`}>
                    {labelForType(locale, step.type, step.tool)}
                  </span>
                  <span className="text-xs text-slate-500">{formatRelative(locale, step.relativeMs)}</span>
                </div>
                <p className={compact ? "mt-2 text-sm leading-6 text-slate-600" : "mt-3 text-sm leading-7 text-slate-600"}>
                  {step.summary}
                </p>
              </InsetCard>
            </div>
          );
        })}
      </div>
    </div>
  );
}
