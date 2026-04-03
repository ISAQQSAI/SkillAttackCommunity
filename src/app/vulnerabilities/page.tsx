import Link from "next/link";

import { PublicRiskFilterBar } from "@/components/public-risk-filter-bar";
import { PublicVulnerabilityCard } from "@/components/public-vulnerability-card";
import {
  actionButtonClass,
  EmptyState,
  fieldClass,
  PageStat,
  SurfaceCard,
} from "@/components/page-chrome";
import {
  findPublicRiskCategoryByRiskType,
  getPublicRiskCategory,
  getPublicRiskCategoryLabel,
  PUBLIC_RISK_CATEGORIES,
} from "@/lib/public-risk-categories";
import { getLocale } from "@/lib/server/locale";
import {
  getPublicVulnerabilityLibrarySummary,
  listPublicVulnerabilities,
} from "@/lib/server/public-skills";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const PAGE_SIZE = 10;

function formatNumber(locale: string, value: number, suffix?: string) {
  const formatted = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

  return `${formatted}${suffix || ""}`;
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
  return [...new Set(levels.filter(Boolean))].sort((left, right) => {
    return levelRank(left) - levelRank(right) || left.localeCompare(right);
  });
}

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildPageHref(
  page: number,
  query: Record<string, string | undefined>
) {
  const nextQuery = Object.fromEntries(
    Object.entries({
      ...query,
      page: page > 1 ? String(page) : undefined,
    }).filter((entry): entry is [string, string] => Boolean(entry[1]))
  );

  return Object.keys(nextQuery).length
    ? { pathname: "/vulnerabilities", query: nextQuery }
    : "/vulnerabilities";
}

export default async function VulnerabilitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const selectedRisk = getPublicRiskCategory(firstParam(params.risk))?.slug;
  const requestedPage = parsePage(firstParam(params.page));
  const filters = {
    risk: selectedRisk,
    skill: firstParam(params.skill),
    level: firstParam(params.level),
    result: firstParam(params.result),
  };
  const [summary, filteredRecords, allVulnerabilities] = await Promise.all([
    getPublicVulnerabilityLibrarySummary(),
    listPublicVulnerabilities(filters),
    listPublicVulnerabilities(),
  ]);
  const riskCounts = new Map(PUBLIC_RISK_CATEGORIES.map((category) => [category.slug, 0]));
  const resultCounts = new Map([
    ["success", 0],
    ["technical", 0],
    ["ignore", 0],
  ]);
  const levelCounts = new Map<string, number>();

  for (const item of allVulnerabilities) {
    if (resultCounts.has(item.result)) {
      resultCounts.set(item.result, (resultCounts.get(item.result) ?? 0) + 1);
    }
    if (item.surfaceLevel) {
      levelCounts.set(item.surfaceLevel, (levelCounts.get(item.surfaceLevel) ?? 0) + 1);
    }

    const category = findPublicRiskCategoryByRiskType(item.riskType);
    if (!category) {
      continue;
    }

    riskCounts.set(category.slug, (riskCounts.get(category.slug) ?? 0) + 1);
  }

  const levelOptions = sortLevelOptions(Array.from(levelCounts.keys()));
  const activeRiskCategory = getPublicRiskCategory(selectedRisk);
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const records = filteredRecords.slice(pageStart, pageStart + PAGE_SIZE);
  const pageQuery = {
    skill: filters.skill,
    risk: selectedRisk,
    level: filters.level,
    result: filters.result,
  };
  const pageStartNumber = filteredRecords.length ? pageStart + 1 : 0;
  const pageEndNumber = Math.min(pageStart + PAGE_SIZE, filteredRecords.length);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) => {
    return (
      totalPages <= 7 ||
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 1
    );
  });

  const copy =
    locale === "zh"
      ? {
          badge: "公开 surface 社区",
          title: "攻击面案例",
          body:
            "这里完全基于当前公开数据集，按 surface 粒度展示。顶部统计现在和首页对齐，筛选区也支持按 8 类风险过滤结果。",
          stats: {
            surfaces: "轨迹",
            skills: "skill 数",
            models: "模型数",
          },
          filters: {
            risk: "可先按 8 类风险分类筛选，再按 skill 名称筛选。",
            skill: "按 skill 名称筛选",
            level: "按 surface level / 风险类型筛选",
            result: "按结果筛选",
            apply: "筛选",
          },
          pagination: {
            summary: `当前展示第 ${formatNumber(locale, pageStartNumber)}-${formatNumber(locale, pageEndNumber)} 条，共 ${formatNumber(locale, filteredRecords.length)} 条`,
            previous: "上一页",
            next: "下一页",
            page: "页码",
          },
          empty: "还没有可展示的 surface",
          emptyBody: "等当前公开数据集里有可解析的 surface 数据后，这里会出现按 surface 粒度展示的案例卡片。",
          upload: "上传新报告",
          summary: {
            success: "成功 surface",
            technical: "技术问题",
            ignored: "未复现",
          },
        }
      : {
          badge: "Public surface community",
          title: "Surface cases",
          body:
            "This page is backed only by the current public dataset and rendered at the surface level. The top metrics now align with home, and the filters also support the same eight risk categories.",
          stats: {
            surfaces: "Trajectories",
            skills: "Skills",
            models: "Models",
          },
          filters: {
            risk: "Start with one of the eight fixed risk categories, then filter by skill name.",
            skill: "Filter by skill name",
            level: "Filter by level / risk type",
            result: "Filter by result",
            apply: "Apply",
          },
          pagination: {
            summary: `Showing ${formatNumber(locale, pageStartNumber)}-${formatNumber(locale, pageEndNumber)} of ${formatNumber(locale, filteredRecords.length)} trajectories`,
            previous: "Previous",
            next: "Next",
            page: "Page",
          },
          empty: "No parsed surfaces yet",
          emptyBody: "Surface-level cards will appear here once the current public dataset includes parsed surface runs.",
          upload: "Submit a report",
          summary: {
            success: "Successful surfaces",
            technical: "Technical outcomes",
            ignored: "Ignored outcomes",
          },
        };

  return (
    <div className="grid gap-8">
      <section className="border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(243,248,255,0.98))] px-6 py-6 text-slate-900 shadow-[0_20px_44px_rgba(15,23,42,0.05)] sm:px-8 sm:py-7">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,0.52fr)_minmax(0,0.52fr)_minmax(0,0.52fr)] xl:items-stretch">
          <div className="grid content-center gap-4 border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-6 py-6 sm:px-8">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {copy.badge}
            </div>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-[2.6rem]">
              {copy.title}
            </h1>
            <div className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px] sm:leading-7">
              {copy.body}
            </div>
          </div>

          {[
            {
              label: copy.stats.surfaces,
              value: formatNumber(locale, summary.surfaceCount),
              hint: locale === "zh" ? "按公开轨迹条目统计" : "counted as public trajectory entries",
            },
            {
              label: copy.stats.skills,
              value: formatNumber(locale, summary.uniqueSkillCount),
              hint: locale === "zh" ? "公开漏洞涉及的 skill" : "skills touched by public vulnerabilities",
            },
            {
              label: copy.stats.models,
              value: formatNumber(locale, summary.modelCount),
              hint: locale === "zh" ? "来自 round 运行记录" : "parsed from round execution records",
            },
          ].map((stat) => (
            <div
              key={String(stat.label)}
              className="grid h-full grid-rows-[auto_1fr_auto] items-center border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f6faff)] px-5 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
            >
              <div className="justify-self-center border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                {stat.label}
              </div>
              <div className="grid place-items-center py-3">
                <div className="text-5xl font-semibold tracking-[-0.07em] text-slate-950 sm:text-6xl">
                  {stat.value}
                </div>
              </div>
              <div className="text-center text-[13px] leading-5 text-slate-500">
                {stat.hint}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[15rem_minmax(0,1fr)] xl:items-start">
        <PublicRiskFilterBar
          locale={locale}
          pathname="/vulnerabilities"
          selectedRisk={selectedRisk}
          selectedResult={filters.result}
          selectedLevel={filters.level}
          totalCount={allVulnerabilities.length}
          riskCounts={riskCounts}
          resultCounts={resultCounts}
          levelCounts={levelCounts}
          levelOptions={levelOptions}
          layout="sidebar"
          preservedQuery={{
            skill: filters.skill,
            risk: selectedRisk,
            level: filters.level,
            result: filters.result,
          }}
        />

        <div className="grid gap-6">
          <section className="border border-slate-200 bg-white p-6">
            <div className="grid gap-3">
              {activeRiskCategory ? (
                <div className="text-sm leading-7 text-slate-600">
                  {locale === "zh"
                    ? `当前按「${getPublicRiskCategoryLabel(activeRiskCategory, locale)}」筛选。`
                    : `Currently filtered by “${getPublicRiskCategoryLabel(activeRiskCategory, locale)}”.`}
                </div>
              ) : null}
              <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  name="skill"
                  defaultValue={filters.skill}
                  placeholder={copy.filters.skill}
                  className={fieldClass("input")}
                />
                <div className="grid gap-4">
                  <input type="hidden" name="level" value={filters.level || ""} />
                  <input type="hidden" name="result" value={filters.result || ""} />
                  <input type="hidden" name="risk" value={selectedRisk || ""} />
                  <button className={actionButtonClass("primary")}>{copy.filters.apply}</button>
                </div>
              </form>
            </div>
          </section>

          {records.length ? (
            <div className="grid gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                <div>{copy.pagination.summary}</div>
                <div>{`${copy.pagination.page} ${formatNumber(locale, currentPage)} / ${formatNumber(locale, totalPages)}`}</div>
              </div>

              <section className="grid gap-4 xl:grid-cols-2">
                {records.map((item) => (
                  <PublicVulnerabilityCard
                    key={item.id}
                    locale={locale}
                    item={item}
                    variant="list"
                    density="compact"
                    combineRiskAndModel
                    metaLayout="band"
                    accentBackground
                    showFinalReason
                    finalReasonLength={200}
                    resultBadgeTone="list"
                  />
                ))}
              </section>

              {totalPages > 1 ? (
                <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 pt-4">
                  <Link
                    href={buildPageHref(Math.max(1, currentPage - 1), pageQuery)}
                    scroll={false}
                    aria-disabled={currentPage === 1}
                    className={`inline-flex items-center justify-center border px-4 py-2 text-sm font-medium transition ${
                      currentPage === 1
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 pointer-events-none"
                        : "border-slate-300 bg-white text-slate-800 hover:border-[#8ea6cb] hover:bg-[#f4f8fd]"
                    }`}
                  >
                    {copy.pagination.previous}
                  </Link>

                  {pageNumbers.map((page, index) => {
                    const previousPage = pageNumbers[index - 1];
                    const showGap = previousPage && page - previousPage > 1;

                    return (
                      <div key={page} className="flex items-center gap-2">
                        {showGap ? <span className="px-1 text-slate-400">…</span> : null}
                        <Link
                          href={buildPageHref(page, pageQuery)}
                          scroll={false}
                          className={`inline-flex h-10 min-w-10 items-center justify-center border px-3 text-sm font-medium transition ${
                            page === currentPage
                              ? "border-[#11284e] bg-[#11284e] text-white !text-white visited:!text-white hover:!text-white"
                              : "border-slate-300 bg-white text-slate-800 hover:border-[#8ea6cb] hover:bg-[#f4f8fd]"
                          }`}
                        >
                          {formatNumber(locale, page)}
                        </Link>
                      </div>
                    );
                  })}

                  <Link
                    href={buildPageHref(Math.min(totalPages, currentPage + 1), pageQuery)}
                    scroll={false}
                    aria-disabled={currentPage === totalPages}
                    className={`inline-flex items-center justify-center border px-4 py-2 text-sm font-medium transition ${
                      currentPage === totalPages
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 pointer-events-none"
                        : "border-slate-300 bg-white text-slate-800 hover:border-[#8ea6cb] hover:bg-[#f4f8fd]"
                    }`}
                  >
                    {copy.pagination.next}
                  </Link>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              title={copy.empty}
              body={copy.emptyBody}
              action={
                <Link href="/submit" className={actionButtonClass("primary")}>
                  {copy.upload}
                </Link>
              }
            />
          )}
        </div>
      </section>

      <SurfaceCard className="grid gap-4 md:grid-cols-3">
        <PageStat
          label={copy.summary.success}
          value={formatNumber(locale, summary.successCount)}
          hint={locale === "zh" ? "最终结果为 success" : "final result marked as success"}
        />
        <PageStat
          label={copy.summary.technical}
          value={formatNumber(locale, summary.technicalCount)}
          hint={locale === "zh" ? "最终结果为 technical" : "final result marked as technical"}
        />
        <PageStat
          label={copy.summary.ignored}
          value={formatNumber(locale, summary.ignoreCount)}
          hint={locale === "zh" ? "最终结果为 ignore" : "final result marked as ignore"}
        />
      </SurfaceCard>
    </div>
  );
}
