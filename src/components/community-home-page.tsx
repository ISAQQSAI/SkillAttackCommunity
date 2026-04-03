import Link from "next/link";

import { PublicVulnerabilityCard } from "@/components/public-vulnerability-card";
import { PublicRiskFilterBar } from "@/components/public-risk-filter-bar";
import {
  EmptyState,
  PageStat,
  SectionHeading,
  SurfaceCard,
} from "@/components/page-chrome";
import { HomeActionRail } from "@/components/home-action-rail";
import { getPublicFindingPath } from "@/lib/public-case-routing";
import {
  getPublicRiskCategory,
  getPublicRiskCategoryLabel,
} from "@/lib/public-risk-categories";
import { getLocale } from "@/lib/server/locale";
import {
  buildPublicCaseFilterState,
  buildPublicCaseVulnerabilitySummary,
  createPublicCaseVulnerabilityItems,
  normalizePublicCaseLevelFilter,
  normalizePublicCaseResultFilter,
  sortPublicCaseVulnerabilitiesBySurfaceOrdinal,
} from "@/lib/server/public-case-vulnerabilities";
import { listPublicCases } from "@/lib/server/report-submissions";

function homeButtonClass(tone: "primary" | "secondary" = "primary") {
  if (tone === "secondary") {
    return "inline-flex items-center justify-center border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-900 !text-slate-900 visited:!text-slate-900 transition hover:border-slate-400 hover:bg-[#f3f7fd] hover:!text-slate-900";
  }

  return "inline-flex items-center justify-center border border-[#11284e] bg-[#11284e] px-5 py-3 text-sm font-medium text-white !text-white visited:!text-white hover:bg-[#0d1f3b] hover:!text-white";
}

function viewAllButtonClass() {
  return "inline-flex items-center justify-center border border-[#11284e] bg-[#11284e] px-7 py-3.5 text-base font-medium text-white !text-white visited:!text-white transition hover:bg-[#0d1f3b] hover:!text-white";
}

function formatNumber(locale: string, value: number) {
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US").format(value);
}

export async function CommunityHomePage({
  risk,
  result,
  level,
}: {
  risk?: string;
  result?: string;
  level?: string;
}) {
  const locale = await getLocale();
  const selectedRisk = getPublicRiskCategory(risk)?.slug;
  const publicCases = await listPublicCases();
  const allVulnerabilities = createPublicCaseVulnerabilityItems(publicCases);
  const selectedResult = normalizePublicCaseResultFilter(result);
  const selectedLevel = normalizePublicCaseLevelFilter(
    level,
    allVulnerabilities.map((item) => item.surfaceLevel)
  );
  const filterState = buildPublicCaseFilterState(allVulnerabilities, {
    risk: selectedRisk,
    result: selectedResult,
    level: selectedLevel,
  });
  const filteredVulnerabilities = filterState.filteredItems;
  const summary = buildPublicCaseVulnerabilitySummary(allVulnerabilities);
  const vulnerabilities = sortPublicCaseVulnerabilitiesBySurfaceOrdinal(filteredVulnerabilities).slice(0, 4);
  const activeRiskCategory = getPublicRiskCategory(selectedRisk);
  const hasActiveFilter = Boolean(selectedRisk || selectedResult || selectedLevel);
  const viewAllQuery = Object.fromEntries(
    Object.entries({
      risk: selectedRisk,
      result: selectedResult,
      level: selectedLevel,
    }).filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
  const viewAllHref = Object.keys(viewAllQuery).length
    ? { pathname: "/vulnerabilities", query: viewAllQuery }
    : "/vulnerabilities";
  const heroTitleClassName =
    locale === "zh"
      ? "max-w-none text-[2.25rem] font-semibold leading-[1.04] tracking-[-0.055em] text-slate-950 sm:text-[2.45rem] lg:text-[2.6rem] xl:whitespace-nowrap"
      : "max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl";

  return (
    <div className="grid gap-8">
      <section className="border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,249,255,0.96))] px-6 py-7 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-8 sm:py-9">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.95fr)] xl:items-start">
          <div className="grid gap-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {locale === "zh" ? "社区驱动的技能安全" : "Community-driven Skill Security"}
            </div>
            <div className="grid gap-4">
              <h1 className={heroTitleClassName}>
                {locale === "zh"
                  ? "共同绘制每个智能体技能的攻击轨迹"
                  : "Trace the attack path of every agent skill together."}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-600">
                {locale === "zh"
                  ? (
                    <>
                      由社区贡献的攻击轨迹库。按攻击结果、风险等级和风险类型浏览；
                      <br />
                      提交你的发现，帮助更多人防范智能体风险。
                    </>
                  )
                  : "A community-contributed attack trace library. Browse by attack outcome, risk level, and risk type. Submit your findings to help others defend against agent risks."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/vulnerabilities" className={homeButtonClass("primary")}>
                {locale === "zh" ? "浏览攻击轨迹" : "Browse attack traces"}
              </Link>
              <Link href="/submit" className={homeButtonClass("secondary")}>
                {locale === "zh" ? "上传漏洞报告" : "Submit a report"}
              </Link>
            </div>
          </div>

          <div className="grid gap-px border border-slate-200 bg-slate-200">
            <PageStat
              layout="row"
              className="border-0"
              label={locale === "zh" ? "攻击轨迹" : "Attack Traces"}
              value={formatNumber(locale, summary.surfaceCount)}
              hint={locale === "zh" ? "按公开攻击轨迹条目统计" : "counted as public attack trace entries"}
            />
            <PageStat
              layout="row"
              className="border-0"
              label={locale === "zh" ? "skill 数" : "Skills"}
              value={formatNumber(locale, summary.uniqueSkillCount)}
              hint={locale === "zh" ? "公开漏洞涉及的 skill" : "skills touched by public vulnerabilities"}
            />
            <PageStat
              layout="row"
              className="border-0"
              label={locale === "zh" ? "模型数" : "Models"}
              value={formatNumber(locale, summary.modelCount)}
              hint={locale === "zh" ? "已覆盖的模型" : "Covered models"}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)] xl:items-start">
        <SurfaceCard className="grid gap-5 rounded-none border-slate-200 bg-white shadow-none hover:shadow-none">
          <SectionHeading
            title={locale === "zh" ? "最新攻击轨迹" : "Latest attack traces"}
            description={
              activeRiskCategory
                ? locale === "zh"
                  ? `当前按「${getPublicRiskCategoryLabel(activeRiskCategory, locale)}」筛选，只展示匹配这个风险分类的 surface。`
                  : `Currently filtered by “${getPublicRiskCategoryLabel(activeRiskCategory, locale)}”, showing only the surfaces that match this risk category.`
                : undefined
            }
          />
          <div className="grid gap-5 xl:grid-cols-[15rem_minmax(0,1fr)] xl:items-start">
            <PublicRiskFilterBar
              locale={locale}
              pathname="/home"
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
                risk: selectedRisk,
                result: selectedResult,
                level: selectedLevel,
              }}
            />
            <div className="grid gap-4">
              {vulnerabilities.map((item) => (
                <PublicVulnerabilityCard
                  key={item.id}
                  locale={locale}
                  item={item}
                  detailHref={getPublicFindingPath({
                    slug: item.slug,
                    findingKey: item.surfaceId,
                  })}
                  variant="list"
                  density="compact"
                  promptLength={260}
                  combineRiskAndModel
                  metaLayout="band"
                  accentBackground
                />
              ))}
              {!vulnerabilities.length ? (
                <EmptyState
                  className="rounded-none border-slate-200 bg-slate-50"
                  title={
                    hasActiveFilter
                      ? locale === "zh"
                        ? "当前筛选条件下还没有公开案例"
                        : "No public cases under the current filters yet"
                      : locale === "zh"
                        ? "还没有可浏览的 surface"
                        : "No browseable surfaces yet"
                  }
                  body={
                    hasActiveFilter
                      ? locale === "zh"
                        ? "可以切换结果、等级或风险分类，或者返回“全部”查看当前公开的攻击面案例。"
                        : "Try another result, level, or risk category, or switch back to “All” to browse the currently public surface cases."
                      : locale === "zh"
                        ? "等公开案例进入数据库后，这里会自动出现可浏览的首页卡片。"
                        : "Cards will appear here automatically once published cases exist in the database."
                  }
                />
              ) : null}
              {filteredVulnerabilities.length ? (
                <div className="flex justify-center border-t border-slate-200 pt-3">
                  <Link href={viewAllHref} className={viewAllButtonClass()}>
                    {locale === "zh" ? "查看全部轨迹" : "View all traces"}
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </SurfaceCard>

        <HomeActionRail locale={locale} />
      </section>
    </div>
  );
}
