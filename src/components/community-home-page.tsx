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
import {
  findPublicRiskCategoryByRiskType,
  getPublicRiskCategory,
  getPublicRiskCategoryLabel,
  PUBLIC_RISK_CATEGORIES,
} from "@/lib/public-risk-categories";
import { getLocale } from "@/lib/server/locale";
import { getPublicVulnerabilityLibrarySummary, listPublicVulnerabilities } from "@/lib/server/public-skills";

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

function sortBySurfaceOrdinal<T extends { surfaceOrdinal: string | null; surfaceId: string; agentModel?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftNumber = Number.parseInt(left.surfaceOrdinal || "", 10);
    const rightNumber = Number.parseInt(right.surfaceOrdinal || "", 10);
    const normalizedLeft = Number.isFinite(leftNumber) ? leftNumber : Number.MAX_SAFE_INTEGER;
    const normalizedRight = Number.isFinite(rightNumber) ? rightNumber : Number.MAX_SAFE_INTEGER;

    return (
      normalizedLeft - normalizedRight ||
      left.surfaceId.localeCompare(right.surfaceId) ||
      (left.agentModel || "").localeCompare(right.agentModel || "")
    );
  });
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
  const selectedResult = result;
  const selectedLevel = level;
  const [filteredVulnerabilities, allVulnerabilities, summary] = await Promise.all([
    listPublicVulnerabilities({ risk: selectedRisk, result: selectedResult, level: selectedLevel }),
    listPublicVulnerabilities(),
    getPublicVulnerabilityLibrarySummary(),
  ]);
  const vulnerabilities = sortBySurfaceOrdinal(filteredVulnerabilities).slice(0, 4);
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

  return (
    <div className="grid gap-8">
      <section className="border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,249,255,0.96))] px-6 py-7 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-8 sm:py-9">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.95fr)] xl:items-start">
          <div className="grid gap-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {locale === "zh" ? "可直接使用的漏洞社区" : "A usable vulnerability community"}
            </div>
            <div className="grid gap-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">
                {locale === "zh"
                  ? "先看真实攻击面案例，再决定是否提交你的报告。"
                  : "See real surface cases first, then decide whether to submit your own report."}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-600">
                {locale === "zh"
                  ? "首页现在直接按 surface 粒度浏览公开案例，中间统计收成轨迹数、skill 数和模型数，下面这组卡片支持按 8 类风险筛选结果。"
                  : "The home page now browses public cases at the surface level, reduces the center stats to trajectories, skills, and models, and lets you filter the case list through eight fixed risk categories."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/vulnerabilities" className={homeButtonClass("primary")}>
                {locale === "zh" ? "浏览攻击面案例" : "Browse surface cases"}
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
              label={locale === "zh" ? "轨迹" : "Trajectories"}
              value={formatNumber(locale, summary.surfaceCount)}
              hint={locale === "zh" ? "按公开轨迹条目统计" : "counted as public trajectory entries"}
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
              hint={locale === "zh" ? "来自 round 运行记录" : "parsed from round execution records"}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)] xl:items-start">
        <SurfaceCard className="grid gap-5 rounded-none border-slate-200 bg-white shadow-none hover:shadow-none">
          <SectionHeading
            title={locale === "zh" ? "最新轨迹" : "Latest trajectories"}
            description={
              locale === "zh"
                ? activeRiskCategory
                  ? `当前按「${getPublicRiskCategoryLabel(activeRiskCategory, locale)}」筛选，只展示匹配这个风险分类的 surface。`
                  : "下面支持按 8 类风险筛选结果；卡片保留当前首页结构，并按 No. 顺序展示公开轨迹。"
                : activeRiskCategory
                  ? `Currently filtered by “${getPublicRiskCategoryLabel(activeRiskCategory, locale)}”, showing only the surfaces that match this risk category.`
                : "Use the eight fixed risk categories below while keeping the current home-card structure and ordering the public trajectories by No."
            }
          />
          <div className="grid gap-5 xl:grid-cols-[15rem_minmax(0,1fr)] xl:items-start">
            <PublicRiskFilterBar
              locale={locale}
              pathname="/home"
              selectedRisk={selectedRisk}
              selectedResult={selectedResult}
              selectedLevel={selectedLevel}
              totalCount={allVulnerabilities.length}
              riskCounts={riskCounts}
              resultCounts={resultCounts}
              levelCounts={levelCounts}
              levelOptions={levelOptions}
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
                        ? "等当前公开数据集里出现可解析的 surface 数据后，这里会出现按 surface 粒度展示的卡片。"
                        : "Surface-level cards will appear here once the current public dataset contains parseable surface runs."
                  }
                />
              ) : null}
              {filteredVulnerabilities.length ? (
                <div className="flex justify-center border-t border-slate-200 pt-3">
                  <Link href={viewAllHref} className={viewAllButtonClass()}>
                    {locale === "zh" ? "查看全部轨迹" : "View all trajectories"}
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
