import Link from "next/link";

import { AttackPathTimeline } from "@/components/attack-path-timeline";
import {
  InsetCard,
  PageHero,
  SurfaceCard,
} from "@/components/page-chrome";
import { TrajectoryTimeline } from "@/components/trajectory-timeline";
import type { Locale } from "@/lib/i18n";
import {
  getPublicCasePath,
  getPrimaryPublicCaseSkillId,
  getPublicCaseSkillIds,
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

export function PublicFindingDetail({
  locale,
  result,
  finding,
  skillContextId,
}: {
  locale: Locale;
  result: PublicCaseRecord;
  finding: Record<string, unknown>;
  skillContextId?: string | null;
}) {
  const payload = readJsonRecord(result.payload);
  const bundle = readJsonRecord(payload.bundle);
  const reports = readJsonList(payload.reports).map((item) => readJsonRecord(item));
  const coveredSkillIds = getPublicCaseSkillIds(result.payload);
  const primarySkillId = getPrimaryPublicCaseSkillId(result.payload);
  const findingSkillId = String(finding.reportSkillId || "").trim();
  const activeSkillId =
    findingSkillId && coveredSkillIds.includes(findingSkillId)
      ? findingSkillId
      : skillContextId && coveredSkillIds.includes(skillContextId)
        ? skillContextId
        : primarySkillId;
  const activeReport =
    reports.find((report) => String(report.skillId || "").trim() === activeSkillId) || null;
  const trajectorySteps = readTrajectorySteps(finding.trajectoryTimeline);
  const target = parseSkillPresentation(activeSkillId || findingSkillId || "");

  return (
    <div className="grid gap-6">
      <PageHero
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <span>{locale === "zh" ? "公开漏洞详情" : "Published vulnerability detail"}</span>
            <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-600">
              {formatDate(locale, result.publishedAt)}
            </span>
          </div>
        }
        title={String(finding.harmType || "-")}
        description={
          <>
            <span className="block text-slate-600">{String(finding.vulnerabilitySurface || "-")}</span>
            <span className="mt-3 block text-slate-600">
              {locale === "zh" ? "收录自：" : "Included in: "} {result.title}
            </span>
          </>
        }
        actions={
          <>
            <Link
              href={getPublicCasePath({ slug: result.slug, payload: result.payload })}
              className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5"
            >
              {locale === "zh" ? "返回本次公开结果" : "Back to this published result"}
            </Link>
            <Link
              href="/vulnerabilities"
              className="rounded-full border border-black/10 bg-white/90 px-4 py-2.5 text-sm font-medium text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5"
            >
              {locale === "zh" ? "返回漏洞列表" : "Back to vulnerabilities"}
            </Link>
          </>
        }
        aside={
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <InsetCard tone="white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "受影响对象" : "Affected target"}
              </div>
              <div className="mt-3 text-xl font-semibold tracking-[-0.04em] text-slate-950">
                {target.targetLabel || "-"}
              </div>
            </InsetCard>
            <InsetCard tone="white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "公开结论" : "Result"}
              </div>
              <div className="mt-3 text-xl font-semibold tracking-[-0.04em] text-slate-950">
                {formatVerdictLabel(locale, String(finding.verdict || ""))}
              </div>
            </InsetCard>
            <InsetCard tone="tint">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "轨迹步骤" : "Trajectory steps"}
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {trajectorySteps.length}
              </div>
            </InsetCard>
          </div>
        }
      />

      <SurfaceCard>
        <AttackPathTimeline
          locale={locale}
          finding={finding}
          title={locale === "zh" ? "攻击路径" : "Attack path"}
        />
      </SurfaceCard>

      <SurfaceCard>
        <TrajectoryTimeline
          locale={locale}
          steps={trajectorySteps}
          title={locale === "zh" ? "攻击轨迹时间轴" : "Attack trajectory timeline"}
        />
      </SurfaceCard>

      <SurfaceCard className="grid gap-3 lg:grid-cols-3">
        <InsetCard>
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
            {locale === "zh" ? "攻击输入摘要" : "Prompt summary"}
          </div>
          <p className="mt-2 leading-7 text-slate-700">
            {String(finding.harmfulPromptPreview || "-")}
          </p>
        </InsetCard>
        <InsetCard>
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
            {locale === "zh" ? "关键证据" : "Smoking gun"}
          </div>
          <p className="mt-2 leading-7 text-slate-700">
            {String(finding.smokingGunPreview || "-")}
          </p>
        </InsetCard>
        <InsetCard>
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
            {locale === "zh" ? "最终响应摘要" : "Final response summary"}
          </div>
          <p className="mt-2 leading-7 text-slate-700">
            {String(finding.finalResponsePreview || "-")}
          </p>
        </InsetCard>
      </SurfaceCard>

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

      {(activeReport?.sourceLink || bundle.source) ? (
        <SurfaceCard className="grid gap-3 md:grid-cols-2">
          <InsetCard className="text-sm">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
              {locale === "zh" ? "公开来源" : "Public reference"}
            </div>
            {activeReport?.sourceLink ? (
              <a
                href={String(activeReport.sourceLink)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex break-all text-slate-700 underline-offset-4 hover:underline"
              >
                {String(activeReport.sourceLink)}
              </a>
            ) : (
              <div className="mt-2 text-slate-800">{String(bundle.source || "-")}</div>
            )}
          </InsetCard>
          <InsetCard className="text-sm">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
              {locale === "zh" ? "涉及模型" : "Model context"}
            </div>
            <div className="mt-2 text-slate-800">
              {[String(finding.provider || ""), String(finding.model || "")]
                .filter(Boolean)
                .join(" · ") || "-"}
            </div>
          </InsetCard>
        </SurfaceCard>
      ) : null}
    </div>
  );
}
