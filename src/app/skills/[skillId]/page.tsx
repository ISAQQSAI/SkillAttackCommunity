import Link from "next/link";
import { notFound } from "next/navigation";

import {
  actionButtonClass,
  InsetCard,
  PageHero,
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

function formatDate(locale: string, value?: string | Date | null) {
  if (!value) {
    return "-";
  }
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function verdictBadgeClasses(verdict: string) {
  switch (verdict) {
    case "attack_success":
      return "bg-emerald-100 text-emerald-800";
    case "technical":
      return "bg-amber-100 text-amber-900";
    case "ignored":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
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

  return (
    <div className="grid gap-6">
      <PageHero
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/skills" className="text-sm font-medium text-white/82 underline-offset-4 hover:underline">
              {locale === "zh" ? "返回技能案例库" : "Back to public skills"}
            </Link>
            {record.ordinal ? (
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/76">
                #{record.ordinal}
              </span>
            ) : null}
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/76">
              {record.ownerLabel}
            </span>
            <span className="rounded-full bg-lime-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-950">
              {record.primaryHarmType}
            </span>
          </div>
        }
        tone="dark"
        title={record.skillLabel}
        description={
          <>
            <span className="block text-white/56">{record.skillId}</span>
            <span className="mt-3 block">{record.representativeSummary || "-"}</span>
          </>
        }
        actions={
          <>
            {record.sourceLink ? (
              <a
                href={record.sourceLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/14 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                {locale === "zh" ? "打开来源链接" : "Open source link"}
              </a>
            ) : null}
            {record.representativeCase ? (
              <Link
                href={`/skills/${encodeURIComponent(record.skillId)}/cases/${encodeURIComponent(record.representativeCase.slug)}`}
                className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold !text-slate-950 transition hover:-translate-y-0.5"
                style={{ color: "#0f172a" }}
              >
                {locale === "zh" ? "查看代表性案例" : "Open representative case"}
              </Link>
            ) : null}
          </>
        }
        aside={
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <InsetCard tone="white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{locale === "zh" ? "公开案例" : "Public cases"}</div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">{formatNumber(locale, record.caseCount)}</div>
            </InsetCard>
            <InsetCard tone="white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{locale === "zh" ? "Findings" : "Findings"}</div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">{formatNumber(locale, record.findingCount)}</div>
            </InsetCard>
            <InsetCard tone="tint">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{locale === "zh" ? "模型数" : "Models"}</div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">{formatNumber(locale, record.modelCount)}</div>
            </InsetCard>
          </div>
        }
      />

      <SurfaceCard className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InsetCard>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{locale === "zh" ? "Skill ID" : "Skill ID"}</div>
            <div className="mt-3 text-lg font-semibold">{record.skillId}</div>
          </InsetCard>
          <InsetCard>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{locale === "zh" ? "主要 surface" : "Primary surface"}</div>
            <div className="mt-3 text-lg font-semibold">{record.primarySurfaceLabel}</div>
          </InsetCard>
          <InsetCard>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{locale === "zh" ? "成功判定" : "Successful verdicts"}</div>
            <div className="mt-3 text-lg font-semibold">
              {formatNumber(locale, record.successCount)}/{formatNumber(locale, record.findingCount)}
            </div>
          </InsetCard>
          <InsetCard tone="tint">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{locale === "zh" ? "最近更新" : "Last updated"}</div>
            <div className="mt-3 text-lg font-semibold">{formatDate(locale, record.latestPublishedAt)}</div>
          </InsetCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <InsetCard className="p-5">
            <h2 className="text-lg font-semibold">{locale === "zh" ? "技能概览" : "Skill overview"}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              {record.representativeSummary || "-"}
            </p>
            {record.sourceLink ? (
              <a
                href={record.sourceLink}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-sm font-medium text-slate-700 underline-offset-4 hover:underline"
              >
                {record.sourceLink}
              </a>
            ) : null}
          </InsetCard>

          <InsetCard className="p-5">
            <h2 className="text-lg font-semibold">{locale === "zh" ? "风险与模型" : "Risk and model coverage"}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {record.harmTypes.map((label) => (
                <span key={label} className="rounded-full bg-white px-3 py-2 text-sm text-slate-700">
                  {label}
                </span>
              ))}
            </div>

            <h3 className="mt-6 text-lg font-semibold">{locale === "zh" ? "Models" : "Models"}</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {record.models.map((model) => (
                <span key={model} className="rounded-full bg-white px-3 py-2 text-sm text-slate-700">
                  {model}
                </span>
              ))}
            </div>
          </InsetCard>
        </div>
      </SurfaceCard>

      <SurfaceCard className="grid gap-4">
        <SectionHeading
          title={locale === "zh" ? "该技能下的公开案例" : "Published cases under this skill"}
          description={
            locale === "zh"
              ? "每条公开案例都只保留脱敏后的结构化 finding 和管理员审核结论。"
              : "Each public case keeps only the sanitized structured findings and admin verification summary."
          }
          action={
            <Link href="/skills" className={actionButtonClass("secondary")}>
              {locale === "zh" ? "返回技能案例库" : "Back to public skills"}
            </Link>
          }
        />

        <div className="grid gap-4">
          {record.cases.map((item) => (
            <InsetCard key={`${record.skillId}-${item.slug}`} className="grid gap-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid gap-2">
                  <h3 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">{item.title}</h3>
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                    <span className="rounded-full bg-white px-3 py-1">{formatDate(locale, item.publishedAt)}</span>
                    <span className="rounded-full bg-white px-3 py-1">
                      {item.findingCount} {locale === "zh" ? "findings" : "findings"}
                    </span>
                    {item.models.map((model) => (
                      <span key={model} className="rounded-full bg-white px-3 py-1">{model}</span>
                    ))}
                  </div>
                </div>
                <Link
                  href={`/skills/${encodeURIComponent(record.skillId)}/cases/${encodeURIComponent(item.slug)}`}
                  className={actionButtonClass("primary")}
                >
                  {locale === "zh" ? "查看案例详情" : "Open case detail"}
                </Link>
              </div>

              <p className="text-sm leading-7 text-slate-600">{item.summary}</p>

              {item.verificationSummary ? (
                <InsetCard tone="white" className="text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{locale === "zh" ? "审核结论" : "Verification summary"}</div>
                  <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">{item.verificationSummary}</p>
                </InsetCard>
              ) : null}

              <div className="grid gap-3 lg:grid-cols-2">
                {item.findings.map((finding) => (
                  <InsetCard key={finding.findingKey} tone="white" className="grid gap-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {finding.model ? <span className="rounded-full bg-slate-100 px-3 py-1">{finding.model}</span> : null}
                        {finding.provider ? <span className="rounded-full bg-slate-100 px-3 py-1">{finding.provider}</span> : null}
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${verdictBadgeClasses(finding.verdict)}`}>
                        {finding.verdict}
                      </span>
                    </div>
                    <div>
                      <div className="text-base font-semibold text-slate-900">{finding.harmType}</div>
                      <div className="mt-1 text-slate-500">{finding.vulnerabilitySurface || "-"}</div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{locale === "zh" ? "置信度" : "Confidence"}</div>
                        <div className="mt-2 text-slate-700">{finding.confidence ?? "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{locale === "zh" ? "证据摘要" : "Evidence summary"}</div>
                        <div className="mt-2 text-slate-700">{finding.evidenceSummaryPreview || "-"}</div>
                      </div>
                    </div>
                  </InsetCard>
                ))}
              </div>
            </InsetCard>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
