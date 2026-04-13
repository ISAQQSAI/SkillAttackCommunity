import Link from "next/link";

import { PublicRiskFilterBar } from "@/components/public-risk-filter-bar";
import { PublicVulnerabilityCard } from "@/components/public-vulnerability-card";
import {
  actionButtonClass,
  EmptyState,
  fieldClass,
} from "@/components/page-chrome";
import { getPublicFindingPath } from "@/lib/public-case-routing";
import {
  getPublicRiskCategory,
  getPublicRiskCategoryLabel,
} from "@/lib/public-risk-categories";
import { getLocale } from "@/lib/server/locale";
import {
  buildPublicCaseFilterState,
  getPublicCaseListingSnapshot,
  normalizePublicCaseLevelFilter,
  normalizePublicCaseResultFilter,
  sortPublicCaseVulnerabilitiesForListing,
} from "@/lib/server/public-case-vulnerabilities";

export const dynamic = "force-dynamic";

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

function paginationLinkClass(isActive: boolean) {
  return isActive
    ? "inline-flex h-10 min-w-10 items-center justify-center border px-3 text-sm font-medium transition border-[#11284e] bg-[#11284e] text-white !text-white visited:!text-white hover:!text-white"
    : "inline-flex h-10 min-w-10 items-center justify-center border px-3 text-sm font-medium transition border-slate-300 bg-white text-slate-800 hover:border-[#8ea6cb] hover:bg-[#f4f8fd]";
}

function paginationStepClass(isDisabled: boolean) {
  return isDisabled
    ? "inline-flex items-center justify-center border px-4 py-2 text-sm font-medium transition cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 pointer-events-none"
    : "inline-flex items-center justify-center border px-4 py-2 text-sm font-medium transition border-slate-300 bg-white text-slate-800 hover:border-[#8ea6cb] hover:bg-[#f4f8fd]";
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
  const { items: allVulnerabilities, summary } = await getPublicCaseListingSnapshot();
  const selectedResult = normalizePublicCaseResultFilter(firstParam(params.result));
  const selectedLevel = normalizePublicCaseLevelFilter(
    firstParam(params.level),
    allVulnerabilities.map((item) => item.surfaceLevel)
  );
  const filters = {
    risk: selectedRisk,
    skill: firstParam(params.skill),
    level: selectedLevel,
    result: selectedResult,
  };
  const filterState = buildPublicCaseFilterState(allVulnerabilities, filters);
  const filteredRecords = sortPublicCaseVulnerabilitiesForListing(filterState.filteredItems);
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
          title: "攻击轨迹案例",
          body: "浏览社区公开的攻击轨迹。支持多种筛选方式。",
          stats: {
            rounds: "攻击轨迹",
            skills: "skill 数",
            models: "模型数",
          },
          filters: {
            risk: "可先按 8 类风险分类筛选，再按 skill 名称筛选。",
            skill: "按 skill 名称筛选",
            level: "按潜在漏洞等级筛选",
            result: "按攻击结果筛选",
            apply: "筛选",
          },
          pagination: {
            summary: `当前展示第 ${formatNumber(locale, pageStartNumber)}-${formatNumber(locale, pageEndNumber)} 条，共 ${formatNumber(locale, filteredRecords.length)} 条`,
            previous: "上一页",
            next: "下一页",
            page: "页码",
          },
          empty: "还没有可展示的轨迹",
          emptyBody: "等当前公开数据集里有可解析的 surface 数据后，这里会出现按 surface 粒度展示的案例卡片。",
          upload: "上传新报告",
        }
      : {
          title: "Attack trace cases",
          body: "Browse public attack traces. Multiple filtering options available.",
          stats: {
            rounds: "Attack Traces",
            skills: "Skills",
            models: "Models",
          },
          filters: {
            risk: "Start with one of the eight fixed risk categories, then filter by skill name.",
            skill: "Filter by skill name",
            level: "Filter by potential severity",
            result: "Filter by attack result",
            apply: "Apply",
          },
          pagination: {
            summary: `Showing ${formatNumber(locale, pageStartNumber)}-${formatNumber(locale, pageEndNumber)} of ${formatNumber(locale, filteredRecords.length)} traces`,
            previous: "Previous",
            next: "Next",
            page: "Page",
          },
          empty: "No parsed surfaces yet",
          emptyBody: "Surface-level cards will appear here once the current public dataset includes parsed surface runs.",
          upload: "Submit a report",
        };

  const paginationControls =
    totalPages > 1 ? (
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link
          href={buildPageHref(Math.max(1, currentPage - 1), pageQuery)}
          scroll={false}
          aria-disabled={currentPage === 1}
          className={paginationStepClass(currentPage === 1)}
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
                className={paginationLinkClass(page === currentPage)}
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
          className={paginationStepClass(currentPage === totalPages)}
        >
          {copy.pagination.next}
        </Link>
      </div>
    ) : null;

  return (
    <div className="grid gap-8">
      <section className="border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(243,248,255,0.98))] px-6 py-6 text-slate-900 shadow-[0_20px_44px_rgba(15,23,42,0.05)] sm:px-8 sm:py-7">
        <div className="grid gap-4 xl:grid-cols-[minmax(18rem,1.25fr)_repeat(3,minmax(10.5rem,0.68fr))] xl:items-stretch">
          <div className="grid content-center gap-4 border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-6 py-6 sm:px-8">
            <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-[2.6rem]">
              {copy.title}
            </h1>
            <div className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px] sm:leading-7">
              {copy.body}
            </div>
          </div>

          {[
            {
              label: copy.stats.rounds,
              value: formatNumber(locale, summary.roundCount),
              hint: locale === "zh" ? "公开轨迹 rounds 之和" : "sum of rounds across public traces",
            },
            {
              label: copy.stats.skills,
              value: formatNumber(locale, summary.uniqueSkillCount),
              hint: locale === "zh" ? "公开案例涉及的 skill" : "skills touched by public cases",
            },
            {
              label: copy.stats.models,
              value: formatNumber(locale, summary.modelCount),
              hint: locale === "zh" ? "已覆盖的模型" : "Covered models",
            },
          ].map((stat) => (
            <div
              key={String(stat.label)}
              className="grid h-full min-w-0 grid-rows-[auto_1fr] items-center border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f6faff)] px-4 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
            >
              <div className="min-w-0 justify-self-center whitespace-nowrap border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-normal text-slate-600">
                {stat.label}
              </div>
              <div className="grid place-items-center py-2">
                <div className="text-[2.55rem] font-semibold leading-none tracking-normal text-slate-950 sm:text-[3.15rem]">
                  {stat.value}
                </div>
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
          selectedResult={selectedResult}
          selectedLevel={selectedLevel}
          totalCount={filterState.totalCount}
          allRiskCount={filterState.allRiskCount}
          allResultCount={filterState.allResultCount}
          allLevelCount={filterState.allLevelCount}
          riskCounts={filterState.riskCounts}
          resultCounts={filterState.resultCounts}
          levelCounts={filterState.levelCounts}
          levelOptions={filterState.levelOptions}
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
                <div className="flex flex-wrap items-center gap-3">
                  <div>{`${copy.pagination.page} ${formatNumber(locale, currentPage)} / ${formatNumber(locale, totalPages)}`}</div>
                  {paginationControls}
                </div>
              </div>

              <section className="grid gap-4 xl:grid-cols-2">
                {records.map((item) => (
                  <PublicVulnerabilityCard
                    key={item.id}
                    locale={locale}
                    item={item}
                    detailHref={getPublicFindingPath({
                      slug: item.slug,
                      findingKey: item.surfaceId,
                      reportSkillId: item.skillId,
                      model: item.agentModel,
                    })}
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

              {paginationControls ? (
                <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 pt-4">
                  {paginationControls}
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

    </div>
  );
}
