import Link from "next/link";

import {
  actionButtonClass,
  EmptyState,
  InsetCard,
  PageHero,
  PageStat,
} from "@/components/page-chrome";
import { getLocale } from "@/lib/server/locale";
import {
  getPublicSkillLibrarySummary,
  listPublicSkills,
} from "@/lib/server/public-skills";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatNumber(locale: string, value: number, suffix?: string) {
  const formatted = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

  return `${formatted}${suffix || ""}`;
}

function formatDate(locale: string, value?: string | Date | null) {
  if (!value) {
    return "-";
  }
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
  }).format(date);
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const filters = {
    q: firstParam(params.q),
    vuln: firstParam(params.vuln),
  };
  const [summary, records] = await Promise.all([
    getPublicSkillLibrarySummary(),
    listPublicSkills(filters),
  ]);

  const copy =
    locale === "zh"
      ? {
          badge: "Skill-first 公共库",
          title: "公开技能案例库",
          body:
            "这里把已发布的公开案例按 skill 聚合展示。点进单个 skill 详情页后，可以继续查看它下面的公开案例、风险类型和审核结论。",
          stats: {
            skills: "公开技能",
            cases: "公开案例",
            findings: "公开 findings",
            risks: "风险类型",
          },
          filters: {
            query: "按 skill / owner / model 搜索",
            vuln: "按风险类型筛选",
            apply: "筛选",
          },
          card: {
            cases: "案例",
            findings: "Findings",
            models: "模型",
            primaryRisk: "主要风险",
            successCoverage: "成功判定",
            lastUpdated: "最近更新",
            empty: "还没有已发布的技能案例",
            emptyBody: "等管理员审核并发布后，这里会出现按 skill 聚合的公开页。",
            upload: "上传新的 bundle",
          },
        }
      : {
          badge: "Skill-first public library",
          title: "Public skill library",
          body:
            "Published public-safe cases are grouped by skill here. Open a skill detail page to inspect its case pages, risk patterns, and admin verification notes.",
          stats: {
            skills: "Public skills",
            cases: "Public cases",
            findings: "Published findings",
            risks: "Risk types",
          },
          filters: {
            query: "Search by skill / owner / model",
            vuln: "Filter by risk type",
            apply: "Apply",
          },
          card: {
            cases: "cases",
            findings: "Findings",
            models: "Models",
            primaryRisk: "Primary risk",
            successCoverage: "Successful verdicts",
            lastUpdated: "Last updated",
            empty: "No public skills yet",
            emptyBody: "Skill-grouped public pages will appear here after admin approval.",
            upload: "Upload a bundle",
          },
        };

  return (
    <div className="grid gap-8">
      <PageHero
        tone="dark"
        eyebrow={copy.badge}
        title={copy.title}
        description={copy.body}
        aside={
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {[
              { label: copy.stats.skills, value: summary.uniqueSkillCount },
              { label: copy.stats.cases, value: summary.caseCount },
              { label: copy.stats.findings, value: summary.findingCount },
              { label: copy.stats.risks, value: summary.harmTypeCount },
            ].map((item) => (
              <PageStat
                key={item.label}
                tone="dark"
                label={item.label}
                value={formatNumber(locale, item.value)}
              />
            ))}
          </div>
        }
      />

      <section className="rounded-[2rem] border border-black/8 bg-white/88 p-6 shadow-[0_24px_72px_rgba(15,23,42,0.08)]">
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <input
            name="q"
            defaultValue={filters.q}
            placeholder={copy.filters.query}
            className="w-full rounded-[1.15rem] border border-black/10 bg-white/92 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
          />
          <input
            name="vuln"
            defaultValue={filters.vuln}
            placeholder={copy.filters.vuln}
            className="w-full rounded-[1.15rem] border border-black/10 bg-white/92 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
          />
          <button className={actionButtonClass("primary")}>
            {copy.filters.apply}
          </button>
        </form>
      </section>

      {records.length ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {records.map((record) => (
            <Link
              key={record.skillId}
              href={`/skills/${encodeURIComponent(record.skillId)}`}
              className="group grid gap-5 rounded-[1.8rem] border border-black/8 bg-white/88 p-6 shadow-[0_24px_72px_rgba(15,23,42,0.08)] transition hover:-translate-y-1"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  {record.ordinal ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">#{record.ordinal}</span>
                  ) : null}
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{record.ownerLabel}</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">{record.primaryHarmType}</span>
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                  {record.caseCount} {copy.card.cases}
                </span>
              </div>

              <div className="grid gap-2">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] transition group-hover:text-slate-950">{record.skillLabel}</h2>
                  <p className="mt-2 text-sm text-slate-500">{record.skillId}</p>
                </div>
                {record.sourceLink ? (
                  <p className="text-sm leading-7 text-slate-600">{record.sourceLink}</p>
                ) : null}
                <p className="text-sm leading-7 text-slate-600">
                  {record.representativeSummary || "-"}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <InsetCard className="text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.card.primaryRisk}</div>
                  <div className="mt-2 text-slate-700">{record.primaryHarmType}</div>
                </InsetCard>
                <InsetCard className="text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.card.successCoverage}</div>
                  <div className="mt-2 text-slate-700">
                    {record.successCount}/{record.findingCount}
                  </div>
                </InsetCard>
                <InsetCard className="text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.card.lastUpdated}</div>
                  <div className="mt-2 text-slate-700">{formatDate(locale, record.latestPublishedAt)}</div>
                </InsetCard>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <InsetCard className="text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.card.findings}</div>
                  <div className="mt-2 text-slate-700">{record.findingCount}</div>
                </InsetCard>
                <InsetCard className="text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.card.models}</div>
                  <div className="mt-2 text-slate-700">{record.modelCount}</div>
                </InsetCard>
              </div>

              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                {record.harmTypes.map((label) => (
                  <span key={label} className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                    {label}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <EmptyState
          title={copy.card.empty}
          body={copy.card.emptyBody}
          action={
            <Link href="/submit" className={actionButtonClass("primary")}>
              {copy.card.upload}
            </Link>
          }
        />
      )}
    </div>
  );
}
