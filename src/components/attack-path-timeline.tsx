import { InsetCard } from "@/components/page-chrome";
import type { Locale } from "@/lib/i18n";
import { formatVerdictLabel } from "@/lib/public-presentation";

interface AttackPathFindingLike {
  harmType?: unknown;
  vulnerabilitySurface?: unknown;
  verdict?: unknown;
  confidence?: unknown;
  provider?: unknown;
  model?: unknown;
  evidenceSummaryPreview?: unknown;
  harmfulPromptPreview?: unknown;
  smokingGunPreview?: unknown;
  finalResponsePreview?: unknown;
}

function compactText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function clip(value: unknown, length: number) {
  const text = compactText(value);
  if (!text) {
    return "";
  }
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}...` : text;
}

function verdictLabel(locale: Locale, verdict: string) {
  return formatVerdictLabel(locale, verdict) || (locale === "zh" ? "未标注" : "Unlabeled");
}

function verdictTone(verdict: string) {
  const normalized = verdict.trim().toLowerCase();
  switch (normalized) {
    case "attack_success":
      return {
        dot: "bg-rose-600 text-white",
        chip: "bg-rose-100 text-rose-800",
      };
    case "technical":
      return {
        dot: "bg-amber-500 text-white",
        chip: "bg-amber-100 text-amber-800",
      };
    case "ignored":
      return {
        dot: "bg-slate-500 text-white",
        chip: "bg-slate-200 text-slate-700",
      };
    default:
      return {
        dot: "bg-slate-900 text-white",
        chip: "bg-slate-100 text-slate-700",
      };
  }
}

export function AttackPathTimeline({
  locale,
  finding,
  compact = false,
  title,
}: {
  locale: Locale;
  finding: AttackPathFindingLike;
  compact?: boolean;
  title?: string;
}) {
  const harmType = compactText(finding.harmType) || "-";
  const vulnerabilitySurface = compactText(finding.vulnerabilitySurface) || "-";
  const verdict = compactText(finding.verdict);
  const provider = compactText(finding.provider);
  const model = compactText(finding.model);
  const confidence =
    typeof finding.confidence === "number" ? finding.confidence : Number(finding.confidence);
  const prompt = clip(
    finding.harmfulPromptPreview,
    compact ? 110 : 180
  );
  const evidence = clip(
    finding.evidenceSummaryPreview || finding.smokingGunPreview,
    compact ? 110 : 180
  );
  const outcome = clip(
    finding.finalResponsePreview ||
      finding.smokingGunPreview ||
      finding.evidenceSummaryPreview,
    compact ? 110 : 180
  );
  const surfaceMeta = [provider, model].filter(Boolean).join(" · ");
  const tone = verdictTone(verdict);

  const steps = [
    {
      step: "01",
      label: locale === "zh" ? "攻击输入" : "Prompt",
      title: locale === "zh" ? "恶意提示进入 skill" : "Malicious prompt enters the skill",
      body:
        prompt ||
        (locale === "zh"
          ? "公开页只展示脱敏后的攻击输入摘要。"
          : "The public page only keeps a sanitized prompt summary."),
      dot: "bg-sky-600 text-white",
      chip: "bg-sky-100 text-sky-800",
    },
    {
      step: "02",
      label: locale === "zh" ? "攻击入口" : "Surface",
      title: vulnerabilitySurface,
      body:
        surfaceMeta ||
        (locale === "zh"
          ? `命中的风险类型：${harmType}`
          : `Matched risk type: ${harmType}`),
      dot: "bg-indigo-600 text-white",
      chip: "bg-indigo-100 text-indigo-800",
    },
    {
      step: "03",
      label: locale === "zh" ? "观测证据" : "Evidence",
      title: locale === "zh" ? "可公开的关键证据" : "Public-safe observed evidence",
      body:
        evidence ||
        (locale === "zh"
          ? "公开版里没有更多证据摘录。"
          : "No additional public-safe evidence excerpt is available."),
      dot: "bg-amber-500 text-white",
      chip: "bg-amber-100 text-amber-800",
    },
    {
      step: "04",
      label: locale === "zh" ? "结果影响" : "Outcome",
      title: verdictLabel(locale, verdict),
      body:
        outcome ||
        (locale === "zh"
          ? `公开说明显示这条路径与 ${harmType} 相关。`
          : `The published note links this path to ${harmType}.`),
      meta:
        Number.isFinite(confidence) && confidence >= 0
          ? locale === "zh"
            ? `置信度 ${confidence}`
            : `Confidence ${confidence}`
          : undefined,
      dot: tone.dot,
      chip: tone.chip,
    },
  ];

  return (
    <div className="grid gap-3">
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className={compact ? "min-w-0 break-words text-sm font-semibold text-slate-900" : "min-w-0 break-words text-lg font-semibold text-slate-950"}
          >
            {title}
          </div>
          <span className="max-w-full break-words rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            {harmType}
          </span>
        </div>
      ) : null}

      <div className="grid gap-3">
        {steps.map((step, index) => (
          <div key={step.step} className="grid grid-cols-[auto_1fr] gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold tracking-[0.14em] ${step.dot}`}
              >
                {compact ? index + 1 : step.step}
              </div>
              {index < steps.length - 1 ? (
                <div className="mt-2 h-full w-px min-h-7 bg-[linear-gradient(180deg,_rgba(148,163,184,0.8),_rgba(226,232,240,0.2))]" />
              ) : null}
            </div>
            <InsetCard
              tone={index === steps.length - 1 ? "tint" : "white"}
              className={compact ? "p-3.5" : "p-4"}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`max-w-full break-words rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${step.chip}`}>
                  {step.label}
                </span>
                {step.meta ? <span className="text-xs text-slate-500">{step.meta}</span> : null}
              </div>
              <div
                className={
                  compact
                    ? "mt-2 break-words text-sm font-semibold text-slate-900"
                    : "mt-3 break-words text-sm font-semibold text-slate-900"
                }
              >
                {step.title}
              </div>
              <p
                className={
                  compact
                    ? "mt-1.5 break-words text-sm leading-6 text-slate-600"
                    : "mt-2 break-words text-sm leading-7 text-slate-600"
                }
              >
                {step.body}
              </p>
            </InsetCard>
          </div>
        ))}
      </div>
    </div>
  );
}
