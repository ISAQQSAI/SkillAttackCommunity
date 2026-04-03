import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicVulnerabilityCard } from "@/components/public-vulnerability-card";
import {
  actionButtonClass,
  SectionHeading,
  SurfaceCard,
} from "@/components/page-chrome";
import { getLocale } from "@/lib/server/locale";
import { getPublicSkillById } from "@/lib/server/public-skills";

function formatNumber(locale: string, value: number, suffix?: string) {
  const formatted = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

  return `${formatted}${suffix || ""}`;
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const locale = await getLocale();
  const { skillId: rawSkillId } = await params;
  const skillId = decodeURIComponent(rawSkillId);
  const record = await getPublicSkillById(skillId);

  if (!record) {
    notFound();
  }

  const skillDescriptionText =
    record.skillDescription ||
    (locale === "zh"
      ? "未在解压后的 SKILL.md 中找到 description。"
      : "No description was found in the extracted SKILL.md.");

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-3">
        <Link href="/vulnerabilities" className={actionButtonClass("secondary")}>
          {locale === "zh" ? "返回攻击面列表" : "Back to surfaces"}
        </Link>
        <Link href="/home" className={actionButtonClass("ghost")}>
          {locale === "zh" ? "返回首页" : "Back to home"}
        </Link>
      </div>

      <section className="border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(243,248,255,0.98))] px-6 py-6 text-slate-900 shadow-[0_20px_44px_rgba(15,23,42,0.05)] sm:px-8 sm:py-7">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,0.52fr)_minmax(0,0.52fr)_minmax(0,0.52fr)] xl:items-stretch">
          <div className="grid content-center gap-4 border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-6 py-6 sm:px-8">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {locale === "zh" ? "Skill Detail" : "Skill detail"}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              {record.ordinal ? (
                <span className="border border-slate-300 bg-slate-100 px-3 py-1 font-medium text-slate-900">
                  {`#${record.ordinal}`}
                </span>
              ) : null}
              <span className="border border-slate-300 bg-white px-3 py-1 font-medium text-slate-700">
                {record.ownerLabel}
              </span>
            </div>
            <h1 className="max-w-5xl text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-[2.6rem]">
              {record.skillDisplayName}
            </h1>
          </div>

          {[
            {
              label: locale === "zh" ? "轨迹" : "Trajectories",
              value: formatNumber(locale, record.surfaceCount),
              hint: locale === "zh" ? "当前公开轨迹条目" : "public trajectory entries",
            },
            {
              label: locale === "zh" ? "风险类型" : "Risk Types",
              value: formatNumber(locale, record.riskTypes.length),
              hint: locale === "zh" ? "当前覆盖的风险类型数" : "covered risk type count",
            },
            {
              label: locale === "zh" ? "模型数" : "Models",
              value: formatNumber(locale, record.modelCount),
              hint: locale === "zh" ? "覆盖的 agent model" : "covered agent models",
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
              <div className="text-center text-[13px] leading-5 text-slate-500">{stat.hint}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <SurfaceCard className="grid gap-4">
          <SectionHeading
            title={locale === "zh" ? "Skill Overview" : "Skill overview"}
            description={
              locale === "zh"
                ? "这里展示 skill 的基础标识信息，以及解压后 SKILL.md 里的 description。"
                : "This section shows the basic skill identifiers and the description parsed from the extracted SKILL.md."
            }
          />
          <div className="grid gap-4">
            <div className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2">
              <div className="grid gap-1 bg-white px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {locale === "zh" ? "Owner" : "Owner"}
                </div>
                <div className="text-sm font-medium text-slate-900">{record.ownerLabel}</div>
              </div>
              <div className="grid gap-1 bg-white px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {locale === "zh" ? "Skill ID" : "Skill ID"}
                </div>
                <div className="break-all text-sm font-medium text-slate-900">{record.skillId}</div>
              </div>
            </div>

            <div className="border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-5 py-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {locale === "zh" ? "SKILL.md Description" : "SKILL.md description"}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-700">
                {skillDescriptionText}
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="grid gap-5">
          <SectionHeading
            title={locale === "zh" ? "Coverage" : "Coverage"}
            description={
              locale === "zh"
                ? "按当前公开轨迹汇总该 skill 涉及的风险类型、等级和 agent models。"
                : "Risk types, levels, and agent models covered by the currently public trajectories."
            }
          />

          <div className="grid gap-4">
            <div className="grid gap-2 border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {locale === "zh" ? "Risk Types" : "Risk types"}
              </div>
              <div className="flex flex-wrap gap-2">
                {record.riskTypes.map((label) => (
                  <span key={label} className="border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-2 border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {locale === "zh" ? "Surface Levels" : "Surface levels"}
              </div>
              <div className="flex flex-wrap gap-2">
                {record.surfaceLevels.map((level) => (
                  <span key={level} className="border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                    {level}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-2 border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {locale === "zh" ? "Agent Models" : "Agent models"}
              </div>
              <div className="flex flex-wrap gap-2">
                {record.agentModels.map((model) => (
                  <span key={model} className="border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                    {model}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </SurfaceCard>
      </section>

      <SurfaceCard className="grid gap-4">
        <SectionHeading
          title={locale === "zh" ? "该 skill 下的 surface" : "Surfaces under this skill"}
          description={
            locale === "zh"
              ? "每个 surface 都直接来自当前公开数据集，并沿用首页与攻击面列表页的同一套卡片结构。"
              : "Each surface is parsed directly from the current public dataset and uses the same card structure as home and the surface listing page."
          }
          action={
            <Link href="/vulnerabilities" className={actionButtonClass("secondary")}>
              {locale === "zh" ? "返回攻击面总览" : "Back to surfaces"}
            </Link>
          }
        />

        <div className="grid gap-4 xl:grid-cols-2">
          {record.surfaces.map((item) => (
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
        </div>
      </SurfaceCard>
    </div>
  );
}
