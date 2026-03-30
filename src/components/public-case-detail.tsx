import Link from "next/link";

import {
  InsetCard,
  PageHero,
  SectionHeading,
  SurfaceCard,
} from "@/components/page-chrome";
import type { Locale } from "@/lib/i18n";
import {
  getPrimaryPublicCaseSkillId,
  getPublicCaseSkillIds,
  getPublicCasePath,
  readJsonList,
  readJsonRecord,
} from "@/lib/public-case-routing";
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

export function PublicCaseDetail({
  locale,
  result,
  skillContextId,
}: {
  locale: Locale;
  result: PublicCaseRecord;
  skillContextId?: string | null;
}) {
  const payload = readJsonRecord(result.payload);
  const bundle = readJsonRecord(payload.bundle);
  const findings = readJsonList(payload.findings).map((item) => readJsonRecord(item));
  const reports = readJsonList(payload.reports).map((item) => readJsonRecord(item));
  const coveredSkillIds = getPublicCaseSkillIds(result.payload);
  const primarySkillId = getPrimaryPublicCaseSkillId(result.payload);
  const activeSkillId =
    skillContextId && coveredSkillIds.includes(skillContextId) ? skillContextId : primarySkillId;
  const activeReport =
    reports.find((report) => String(report.skillId || "").trim() === activeSkillId) || null;

  return (
    <div className="grid gap-6">
      <PageHero
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <span>{locale === "zh" ? "管理员已审核" : "admin verified"}</span>
            {activeSkillId ? (
              <span className="rounded-full bg-lime-300 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-950">
                {locale === "zh" ? "技能上下文" : "skill context"} · {activeSkillId}
              </span>
            ) : null}
            <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-600">
              {formatDate(locale, result.publishedAt)}
            </span>
          </div>
        }
        title={result.title}
        description={result.summary}
        actions={
          <>
            {activeSkillId ? (
              <Link
                href={`/skills/${encodeURIComponent(activeSkillId)}`}
                className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5"
              >
                {locale === "zh" ? "返回当前技能页" : "Back to this skill"}
              </Link>
            ) : null}
            <Link
              href="/skills"
              className="rounded-full border border-black/10 bg-white/90 px-4 py-2.5 text-sm font-medium text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5"
            >
              {locale === "zh" ? "返回技能案例库" : "Back to public skills"}
            </Link>
          </>
        }
        aside={
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <InsetCard tone="white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "当前技能" : "Active skill"}
              </div>
              <div className="mt-3 text-xl font-semibold tracking-[-0.04em] text-slate-950">
                {activeSkillId || "-"}
              </div>
            </InsetCard>
            <InsetCard tone="white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "涉及 reports" : "Reports"}
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {String(bundle.reportCount || reports.length || 0)}
              </div>
            </InsetCard>
            <InsetCard tone="tint">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "涉及 findings" : "Findings"}
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {findings.length}
              </div>
            </InsetCard>
          </div>
        }
      />

      {payload.verificationSummary ? (
        <SurfaceCard>
          <h2 className="text-2xl font-semibold tracking-[-0.04em]">
            {locale === "zh" ? "审核结论" : "Verification summary"}
          </h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {String(payload.verificationSummary)}
          </p>
        </SurfaceCard>
      ) : null}

      {(activeReport?.sourceLink || bundle.source) ? (
        <SurfaceCard>
          <SectionHeading
            title={locale === "zh" ? "技能上下文" : "Skill context"}
            description={
              locale === "zh"
                ? "这个案例页在公开层面挂在技能详情下面，便于沿着 skill 浏览它的风险样本。"
                : "This case page sits under the skill detail view so the public library can be browsed skill by skill."
            }
          />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <InsetCard className="text-sm">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                {locale === "zh" ? "技能 ID" : "Skill ID"}
              </div>
              <div className="mt-2 text-slate-800">{activeSkillId || "-"}</div>
            </InsetCard>
            <InsetCard className="text-sm">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                {locale === "zh" ? "来源链接" : "Source link"}
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
          </div>
        </SurfaceCard>
      ) : null}

      <section className="grid gap-4">
        {findings.map((finding) => (
          <SurfaceCard key={String(finding.findingKey)} className="grid gap-4">
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
              {finding.reportSkillId ? (
                <span className="rounded-full bg-slate-50 px-3 py-1">{String(finding.reportSkillId)}</span>
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
                  {locale === "zh" ? "判定" : "Verdict"}
                </div>
                <div className="mt-2 text-slate-800">{String(finding.verdict || "-")}</div>
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
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
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
            </div>
          </SurfaceCard>
        ))}
      </section>

      <SurfaceCard>
        <SectionHeading
          title={locale === "zh" ? "覆盖技能与来源" : "Covered skills and sources"}
          description={
            locale === "zh"
              ? "一个公开案例可能覆盖多个 skill；这里保留技能页入口和可公开的来源链接。"
              : "A public case can cover multiple skills; this section keeps the skill entry points and public-safe source links."
          }
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {reports.map((report, index) => {
            const skillId = String(report.skillId || "").trim();
            const isActive = skillId && skillId === activeSkillId;

            return (
              <InsetCard key={`${skillId || "report"}-${index}`} className="text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-slate-900">{skillId || "-"}</div>
                  {isActive ? (
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white">
                      {locale === "zh" ? "当前上下文" : "active"}
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 text-slate-600">
                  {(locale === "zh" ? "发现数" : "Findings")}: {String(report.findingCount ?? "-")}
                </div>
                <div className="text-slate-600">
                  {(locale === "zh" ? "成功 surface" : "Successful surfaces")}: {String(report.successfulSurfaceCount ?? "-")}
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {skillId ? (
                    <Link
                      href={`/skills/${encodeURIComponent(skillId)}`}
                      className="inline-flex text-slate-700 underline-offset-4 hover:underline"
                    >
                      {locale === "zh" ? "打开技能页" : "Open skill page"}
                    </Link>
                  ) : null}
                  {skillId ? (
                    <Link
                      href={getPublicCasePath({
                        slug: result.slug,
                        payload: result.payload,
                        preferredSkillId: skillId,
                      })}
                      className="inline-flex text-slate-700 underline-offset-4 hover:underline"
                    >
                      {locale === "zh" ? "以该技能视角查看案例" : "Open case in this skill"}
                    </Link>
                  ) : null}
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
