import Link from "next/link";

import { AttackPathTimeline } from "@/components/attack-path-timeline";
import {
  InsetCard,
  PageHero,
  SectionHeading,
  SurfaceCard,
} from "@/components/page-chrome";
import type { Locale } from "@/lib/i18n";
import {
  getPublicFindingPath,
  readJsonList,
  readJsonRecord,
} from "@/lib/public-case-routing";
import { formatVerdictLabel, parseSkillPresentation } from "@/lib/public-presentation";
import type { getPublicCaseBySlug } from "@/lib/server/report-submissions";

type PublicCaseRecord = NonNullable<Awaited<ReturnType<typeof getPublicCaseBySlug>>>;

function formatDate(locale: Locale, value?: string | Date | null) {
  if (!value) {
    return "-";
  }
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function readTrajectorySteps(value: unknown) {
  return readJsonList(value)
    .map((item) => {
      const record = readJsonRecord(item);
      const status: "ok" | "error" | undefined =
        record.status === "error" ? "error" : record.status === "ok" ? "ok" : undefined;
      return {
        stepIndex: Number(record.stepIndex || 0),
        relativeMs:
          typeof record.relativeMs === "number" ? record.relativeMs : Number(record.relativeMs || 0),
        type: String(record.type || ""),
        tool: String(record.tool || ""),
        status,
        summary: String(record.summary || ""),
      };
    })
    .filter((item) => item.summary);
}

export function PublicCaseDetail({
  locale,
  result,
}: {
  locale: Locale;
  result: PublicCaseRecord;
}) {
  const payload = readJsonRecord(result.payload);
  const bundle = readJsonRecord(payload.bundle);
  const findings = readJsonList(payload.findings).map((item) => readJsonRecord(item));
  const reports = readJsonList(payload.reports).map((item) => readJsonRecord(item));
  const coveredSkillIds = [...new Set(reports.map((report) => String(report.skillId || "").trim()).filter(Boolean))];
  const sourceLinks = reports
    .map((report) => String(report.sourceLink || "").trim())
    .filter(Boolean);

  return (
    <div className="grid gap-6">
      <PageHero
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <span>{locale === "zh" ? "公开结果页" : "Published result"}</span>
            <span className="rounded-full bg-lime-300 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-950">
              {locale === "zh" ? "已审核并发布" : "Reviewed and published"}
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-600">
              {formatDate(locale, result.publishedAt)}
            </span>
          </div>
        }
        title={result.title}
        description={result.summary}
        actions={
          <Link
            href="/vulnerabilities"
            className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5"
          >
            {locale === "zh" ? "返回漏洞列表" : "Back to vulnerabilities"}
          </Link>
        }
        aside={
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <InsetCard tone="white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "公开漏洞" : "Public vulnerabilities"}
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {findings.length}
              </div>
            </InsetCard>
            <InsetCard tone="white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "涉及对象" : "Affected targets"}
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {coveredSkillIds.length || String(bundle.reportCount || reports.length || 0)}
              </div>
            </InsetCard>
            <InsetCard tone="tint">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "公开来源" : "References"}
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {sourceLinks.length || (bundle.source ? 1 : 0)}
              </div>
            </InsetCard>
          </div>
        }
      />

      {payload.verificationSummary ? (
        <SurfaceCard>
          <h2 className="text-2xl font-semibold tracking-[-0.04em]">
            {locale === "zh" ? "发布说明" : "Published note"}
          </h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {String(payload.verificationSummary)}
          </p>
        </SurfaceCard>
      ) : null}

      {(sourceLinks.length || bundle.source) ? (
        <SurfaceCard>
          <SectionHeading
            title={locale === "zh" ? "公开来源与对象" : "Public references and targets"}
            description={
              locale === "zh"
                ? "这次公开结果覆盖了哪些对象，以及你可以继续查看的公开来源。"
                : "See which targets are affected in this published result and which public references remain available."
            }
          />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <InsetCard className="text-sm">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                {locale === "zh" ? "涉及对象" : "Affected targets"}
              </div>
              <div className="mt-2 grid gap-2">
                {coveredSkillIds.map((skillId) => {
                  const target = parseSkillPresentation(skillId);
                  return (
                    <div key={skillId} className="rounded-full bg-white px-3 py-2 text-slate-800">
                      {target.targetLabel}
                    </div>
                  );
                })}
              </div>
            </InsetCard>
            <InsetCard className="text-sm">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                {locale === "zh" ? "公开来源" : "Public references"}
              </div>
              <div className="mt-2 grid gap-2">
                {sourceLinks.length
                  ? sourceLinks.map((sourceLink) => (
                      <a
                        key={sourceLink}
                        href={sourceLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex break-all text-slate-700 underline-offset-4 hover:underline"
                      >
                        {sourceLink}
                      </a>
                    ))
                  : (
                      <div className="text-slate-800">{String(bundle.source || "-")}</div>
                    )}
              </div>
            </InsetCard>
          </div>
        </SurfaceCard>
      ) : null}

      <section className="grid gap-4">
        {findings.map((finding) => (
          <SurfaceCard key={String(finding.findingKey)} className="grid gap-4">
            {(() => {
              const skillId = String(finding.reportSkillId || "").trim();
              const target = parseSkillPresentation(skillId);

              return (
                <>
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
              {skillId ? (
                <span className="rounded-full bg-slate-50 px-3 py-1">{target.targetLabel}</span>
              ) : null}
              {finding.model ? <span className="rounded-full bg-slate-50 px-3 py-1">{String(finding.model)}</span> : null}
              {finding.provider ? (
                <span className="rounded-full bg-slate-50 px-3 py-1">{String(finding.provider)}</span>
              ) : null}
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                {String(finding.harmType || "-")}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {String(finding.vulnerabilitySurface || "-")}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InsetCard>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  {locale === "zh" ? "公开结论" : "Result"}
                </div>
                <div className="mt-2 text-slate-800">
                  {formatVerdictLabel(locale, String(finding.verdict || ""))}
                </div>
              </InsetCard>
              <InsetCard>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  {locale === "zh" ? "置信度" : "Confidence"}
                </div>
                <div className="mt-2 text-slate-800">{String(finding.confidence ?? "-")}</div>
              </InsetCard>
              <InsetCard className="md:col-span-2">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  {locale === "zh" ? "证据摘要" : "Evidence summary"}
                </div>
                <div className="mt-2 text-slate-800">
                  {String(finding.evidenceSummaryPreview || "-")}
                </div>
              </InsetCard>
              <InsetCard>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  {locale === "zh" ? "轨迹步骤" : "Trajectory steps"}
                </div>
                <div className="mt-2 text-slate-800">
                  {readTrajectorySteps(finding.trajectoryTimeline).length}
                </div>
              </InsetCard>
            </div>
            <AttackPathTimeline
              locale={locale}
              finding={finding}
              compact
              title={locale === "zh" ? "攻击路径摘要" : "Attack path summary"}
            />
            <div className="flex flex-wrap gap-3">
              <Link
                href={getPublicFindingPath({
                  slug: result.slug,
                  findingKey: String(finding.findingKey || ""),
                  payload: result.payload,
                  preferredSkillId: skillId,
                })}
                className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white !text-white shadow-[0_14px_34px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:!text-white"
              >
                {locale === "zh" ? "查看漏洞详情" : "Open vulnerability detail"}
              </Link>
            </div>
                </>
              );
            })()}
          </SurfaceCard>
        ))}
      </section>

      <SurfaceCard>
        <SectionHeading
          title={locale === "zh" ? "涉及对象概览" : "Affected targets overview"}
          description={
            locale === "zh"
              ? "这次发布一共覆盖了哪些对象，以及每个对象下包含多少条公开漏洞。"
              : "See which targets are covered in this publication and how many public vulnerabilities belong to each target."
          }
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {reports.map((report, index) => {
            const skillId = String(report.skillId || "").trim();
            const target = parseSkillPresentation(skillId);

            return (
              <InsetCard key={`${skillId || "report"}-${index}`} className="text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-slate-900">{target.targetLabel || "-"}</div>
                </div>
                <div className="mt-2 text-slate-600">
                  {(locale === "zh" ? "公开漏洞" : "Vulnerabilities")}: {String(report.findingCount ?? "-")}
                </div>
                <div className="text-slate-600">
                  {(locale === "zh" ? "成功入口" : "Successful surfaces")}: {String(report.successfulSurfaceCount ?? "-")}
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {report.sourceLink ? (
                    <a
                      href={String(report.sourceLink)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-slate-700 underline-offset-4 hover:underline"
                    >
                      {locale === "zh" ? "打开来源链接" : "Open source link"}
                    </a>
                  ) : null}
                </div>
              </InsetCard>
            );
          })}
        </div>
      </SurfaceCard>
    </div>
  );
}
