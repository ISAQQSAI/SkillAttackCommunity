import type { ReactNode } from "react";
import Link from "next/link";

import type { Locale } from "@/lib/i18n";
import { getPublicRiskCategoryLabel, PUBLIC_RISK_CATEGORIES } from "@/lib/public-risk-categories";

function filterChipClass(isSelected: boolean, isMuted: boolean) {
  if (isSelected) {
    return "group inline-flex h-10 shrink-0 items-center gap-2 border border-[#11284e] bg-[linear-gradient(180deg,#17345f,#11284e)] px-3 py-2 text-white !text-white shadow-[0_8px_16px_rgba(17,40,78,0.14)] transition";
  }

  return `group inline-flex h-10 shrink-0 items-center gap-2 border px-3 py-2 transition ${
    isMuted
      ? "border-slate-200 bg-[linear-gradient(180deg,#fafcff,#f4f7fb)] text-slate-400 hover:border-slate-300 hover:bg-[#f7faff]"
      : "border-slate-300 bg-white text-slate-800 hover:border-[#8ea6cb] hover:bg-[#f4f8fd] hover:shadow-[0_6px_14px_rgba(36,73,128,0.08)]"
  }`;
}

function filterLabelClass(isSelected: boolean, isMuted: boolean) {
  if (isSelected) {
    return "text-sm font-semibold leading-6 tracking-[-0.01em] text-white !text-white";
  }

  return `text-sm font-semibold leading-6 tracking-[-0.01em] ${
    isMuted ? "text-slate-400" : "text-slate-800"
  }`;
}

function filterCountClass(isSelected: boolean, isMuted: boolean) {
  if (isSelected) {
    return "inline-flex min-w-7 items-center justify-center border border-white/20 bg-white/10 px-1.5 py-1 text-xs font-semibold text-white tabular-nums";
  }

  return `inline-flex min-w-7 items-center justify-center border px-1.5 py-1 text-xs font-semibold tabular-nums ${
    isMuted
      ? "border-slate-200 bg-slate-50 text-slate-400"
      : "border-slate-300 bg-[#f8fbff] text-[#11284e]"
  }`;
}

function formatNumber(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US").format(value);
}

function buildHref(
  pathname: string,
  query: Record<string, string | undefined>,
  updates: Record<string, string | undefined>
) {
  const nextQuery = Object.fromEntries(
    Object.entries({ ...query, ...updates }).filter((entry): entry is [string, string] =>
      Boolean(entry[1])
    )
  );

  if (!Object.keys(nextQuery).length) {
    return pathname;
  }

  return {
    pathname,
    query: nextQuery,
  };
}

function renderFilterLink({
  linkKey,
  locale,
  pathname,
  preservedQuery,
  paramName,
  selectedValue,
  value,
  label,
  count,
  allLabel,
}: {
  linkKey?: string;
  locale: Locale;
  pathname: string;
  preservedQuery: Record<string, string | undefined>;
  paramName: string;
  selectedValue?: string;
  value?: string;
  label: string;
  count: number;
  allLabel?: string;
}) {
  const isSelected = value ? selectedValue === value : !selectedValue;
  const isMuted = count === 0 && !isSelected;

  return (
    <Link
      key={linkKey}
      href={buildHref(pathname, preservedQuery, { [paramName]: value })}
      scroll={false}
      className={`${filterChipClass(isSelected, isMuted)} w-full justify-between`}
    >
      <div className={filterLabelClass(isSelected, isMuted)}>{value ? label : allLabel || label}</div>
      <span className={filterCountClass(isSelected, isMuted)}>{formatNumber(locale, count)}</span>
    </Link>
  );
}

function levelRank(level: string) {
  const normalized = level.toLowerCase();

  if (normalized.includes("critical") || normalized.includes("high") || normalized.includes("高")) {
    return 0;
  }

  if (normalized.includes("medium") || normalized.includes("中")) {
    return 1;
  }

  if (normalized.includes("low") || normalized.includes("低")) {
    return 2;
  }

  return 3;
}

function sortLevelOptions(levels: string[]) {
  return [...levels].sort((left, right) => {
    return levelRank(left) - levelRank(right) || left.localeCompare(right);
  });
}

const RESULT_OPTIONS = ["success", "technical", "ignore"] as const;

function getResultLabel(locale: Locale, value: (typeof RESULT_OPTIONS)[number]) {
  if (locale === "zh") {
    if (value === "success") {
      return "success";
    }
    if (value === "technical") {
      return "technical";
    }
    return "ignore";
  }

  return value;
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2.5 border-t border-slate-200 pt-3 first:border-t-0 first:pt-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

export function PublicRiskFilterBar({
  locale,
  pathname,
  selectedRisk,
  selectedResult,
  selectedLevel,
  totalCount,
  riskCounts,
  resultCounts,
  levelCounts,
  levelOptions = [],
  layout = "horizontal",
  preservedQuery = {},
}: {
  locale: Locale;
  pathname: string;
  selectedRisk?: string;
  selectedResult?: string;
  selectedLevel?: string;
  totalCount: number;
  riskCounts: Map<string, number>;
  resultCounts?: Map<string, number>;
  levelCounts?: Map<string, number>;
  levelOptions?: string[];
  layout?: "horizontal" | "sidebar";
  preservedQuery?: Record<string, string | undefined>;
}) {
  if (layout === "sidebar") {
    const orderedLevels = sortLevelOptions(levelOptions.filter(Boolean));

    return (
      <div className="grid gap-3 border border-slate-200 bg-[linear-gradient(180deg,#fbfdff,#f2f7fc)] p-3 sm:p-4">
        <div className="grid gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {locale === "zh" ? "筛选器" : "Filters"}
          </div>
          <div className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
            {locale === "zh"
              ? `${formatNumber(locale, totalCount)} 条轨迹`
              : `${formatNumber(locale, totalCount)} trajectories`}
          </div>
        </div>

        <FilterSection title={locale === "zh" ? "攻击结果" : "Result"}>
          {renderFilterLink({
            locale,
            pathname,
            preservedQuery,
            paramName: "result",
            selectedValue: selectedResult,
            label: locale === "zh" ? "全部结果" : "All results",
            count: totalCount,
            allLabel: locale === "zh" ? "全部结果" : "All results",
          })}
          {RESULT_OPTIONS.map((value) =>
            renderFilterLink({
              linkKey: `result-${value}`,
              locale,
              pathname,
              preservedQuery,
              paramName: "result",
              selectedValue: selectedResult,
              value,
              label: getResultLabel(locale, value),
              count: resultCounts?.get(value) ?? 0,
            })
          )}
        </FilterSection>

        <FilterSection title="Level">
          {renderFilterLink({
            locale,
            pathname,
            preservedQuery,
            paramName: "level",
            selectedValue: selectedLevel,
            label: locale === "zh" ? "全部等级" : "All levels",
            count: totalCount,
            allLabel: locale === "zh" ? "全部等级" : "All levels",
          })}
          {orderedLevels.map((level) =>
            renderFilterLink({
              linkKey: `level-${level}`,
              locale,
              pathname,
              preservedQuery,
              paramName: "level",
              selectedValue: selectedLevel,
              value: level,
              label: level,
              count: levelCounts?.get(level) ?? 0,
            })
          )}
        </FilterSection>

        <FilterSection title={locale === "zh" ? "风险分类" : "Risk category"}>
          {renderFilterLink({
            locale,
            pathname,
            preservedQuery,
            paramName: "risk",
            selectedValue: selectedRisk,
            label: locale === "zh" ? "全部风险" : "All risks",
            count: totalCount,
            allLabel: locale === "zh" ? "全部风险" : "All risks",
          })}

          {PUBLIC_RISK_CATEGORIES.map((category) =>
            renderFilterLink({
              linkKey: `risk-${category.slug}`,
              locale,
              pathname,
              preservedQuery,
              paramName: "risk",
              selectedValue: selectedRisk,
              value: category.slug,
              label: getPublicRiskCategoryLabel(category, locale),
              count: riskCounts.get(category.slug) ?? 0,
            })
          )}
        </FilterSection>
      </div>
    );
  }

  return (
    <div className="grid gap-3 border border-slate-200 bg-[linear-gradient(180deg,#fbfdff,#f2f7fc)] p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {locale === "zh" ? "风险分类筛选" : "Risk filters"}
        </div>
        <div className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
          {locale === "zh"
            ? `${formatNumber(locale, totalCount)} 条轨迹`
            : `${formatNumber(locale, totalCount)} trajectories`}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {renderFilterLink({
          locale,
          pathname,
          preservedQuery,
          paramName: "risk",
          selectedValue: selectedRisk,
          label: locale === "zh" ? "全部风险" : "All risks",
          count: totalCount,
          allLabel: locale === "zh" ? "全部风险" : "All risks",
        })}

        {PUBLIC_RISK_CATEGORIES.map((category) =>
          renderFilterLink({
            linkKey: `risk-${category.slug}`,
            locale,
            pathname,
            preservedQuery,
            paramName: "risk",
            selectedValue: selectedRisk,
            value: category.slug,
            label: getPublicRiskCategoryLabel(category, locale),
            count: riskCounts.get(category.slug) ?? 0,
          })
        )}
      </div>
    </div>
  );
}
