import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminSubmissionActions } from "@/components/admin-submission-actions";
import {
  EmptyState,
  InsetCard,
  PageHero,
  SectionHeading,
  SurfaceCard,
} from "@/components/page-chrome";
import { SubmissionStatusBadge } from "@/components/submission-status-badge";
import { getLocale } from "@/lib/server/locale";
import { getPublicCasePath } from "@/lib/public-case-routing";
import { requireRole } from "@/lib/server/auth";
import { getAdminSubmission } from "@/lib/server/report-submissions";
import type { SubmissionStatus } from "@/lib/submission-ui";

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

function readPayloadPreview(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();

  try {
    await requireRole(["admin"]);
  } catch {
    return (
      <EmptyState
        title={locale === "zh" ? "只有管理员可以查看该页面" : "Admin access required"}
        body={locale === "zh" ? "请使用管理员身份登录后再查看审核详情。" : "Sign in as an admin to view this review detail page."}
      />
    );
  }

  const { id } = await params;
  let submission;

  try {
    submission = await getAdminSubmission(id);
  } catch {
    notFound();
  }

  const preview = readPayloadPreview(submission.previewPayload);
  const previewFindings = Array.isArray(preview.findings)
    ? (preview.findings as Array<Record<string, unknown>>)
    : [];
  const redactionSummary = readPayloadPreview(submission.redactionSummary);

  return (
    <div className="grid gap-6">
      <PageHero
        tone="dark"
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <SubmissionStatusBadge
              status={submission.status as SubmissionStatus}
              locale={locale}
            />
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/78">
              {submission.publicId}
            </span>
          </div>
        }
        title={submission.originalFilename}
        description={
          locale === "zh"
            ? "这是 guest 正式提交后的审核详情页。管理员可以下载原始 bundle，同时基于脱敏预览决定是否通过审核和发布。"
            : "This is the admin review detail page for a formally submitted guest bundle. Admins can download the original bundle while using the sanitized preview to approve or publish it."
        }
        actions={
          <>
            <a
              href={`/api/admin/reports/${submission.publicId}/bundle`}
              className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
            >
              {locale === "zh" ? "下载原始 bundle" : "Download original bundle"}
            </a>
            {submission.publicCase ? (
              <Link
                href={getPublicCasePath({
                  slug: submission.publicCase.slug,
                  payload: submission.publicCase.payload,
                })}
                className="rounded-full border border-white/14 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                {locale === "zh" ? "打开案例详情" : "Open case detail"}
              </Link>
            ) : null}
          </>
        }
        aside={
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <InsetCard tone="white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "提交时间" : "Submitted"}
              </div>
              <div className="mt-3 text-sm text-slate-700">{formatDate(locale, submission.submittedAt)}</div>
            </InsetCard>
            <InsetCard tone="white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "发布时间" : "Published"}
              </div>
              <div className="mt-3 text-sm text-slate-700">{formatDate(locale, submission.publishedAt)}</div>
            </InsetCard>
            <InsetCard tone="tint">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "提取 findings" : "Extracted findings"}
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">{previewFindings.length}</div>
            </InsetCard>
          </div>
        }
      />

      <section className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="grid gap-4">
          <SurfaceCard>
            <h2 className="text-lg font-semibold tracking-[-0.03em]">{locale === "zh" ? "提交流水元数据" : "Submission metadata"}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <InsetCard className="text-sm">
                <strong>{locale === "zh" ? "显示名称" : "Submitter label"}:</strong> {submission.submitterLabel || "-"}
              </InsetCard>
              <InsetCard className="text-sm">
                <strong>{locale === "zh" ? "联系邮箱" : "Contact email"}:</strong> {submission.contactEmail || "-"}
              </InsetCard>
              <InsetCard className="text-sm">
                <strong>{locale === "zh" ? "提交时间" : "Submitted at"}:</strong> {formatDate(locale, submission.submittedAt)}
              </InsetCard>
              <InsetCard className="text-sm">
                <strong>{locale === "zh" ? "发布时间" : "Published at"}:</strong> {formatDate(locale, submission.publishedAt)}
              </InsetCard>
            </div>
            <InsetCard className="mt-4 text-sm">
              <strong>{locale === "zh" ? "用户备注" : "Submission notes"}:</strong>
              <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">{submission.submissionNotes || "-"}</p>
            </InsetCard>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-lg font-semibold tracking-[-0.03em]">{locale === "zh" ? "脱敏摘要" : "Redaction summary"}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <InsetCard className="text-sm">
                <strong className="block">{locale === "zh" ? "隐藏区域" : "Hidden sections"}</strong>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Array.isArray(redactionSummary.hiddenSections) && redactionSummary.hiddenSections.length ? (
                    redactionSummary.hiddenSections.map((item) => (
                      <span key={String(item)} className="rounded-full bg-white px-3 py-1 text-xs text-slate-700">
                        {String(item)}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </div>
              </InsetCard>
              <InsetCard className="text-sm">
                <strong className="block">{locale === "zh" ? "替换计数" : "Replacement counts"}</strong>
                <div className="mt-2 grid gap-2">
                  {redactionSummary.replacements && typeof redactionSummary.replacements === "object" ? (
                    Object.entries(redactionSummary.replacements as Record<string, unknown>).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-full bg-white px-3 py-1 text-xs text-slate-700">
                        <span>{key}</span>
                        <span>{String(value)}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </div>
              </InsetCard>
            </div>
            {Array.isArray(redactionSummary.flags) && redactionSummary.flags.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {redactionSummary.flags.map((flag) => (
                  <span key={String(flag)} className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900">
                    {String(flag)}
                  </span>
                ))}
              </div>
            ) : null}
          </SurfaceCard>

          <section className="grid gap-4">
            {previewFindings.map((finding) => (
              <SurfaceCard key={String(finding.findingKey)} className="grid gap-4">
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <span className="rounded-full bg-slate-50 px-3 py-1">{String(finding.reportSkillId || "-")}</span>
                  {finding.model ? <span className="rounded-full bg-slate-50 px-3 py-1">{String(finding.model)}</span> : null}
                  {finding.provider ? <span className="rounded-full bg-slate-50 px-3 py-1">{String(finding.provider)}</span> : null}
                </div>
                <h2 className="mt-4 text-xl font-semibold">{String(finding.harmType || "-")}</h2>
                <p className="mt-2 text-sm text-slate-500">{String(finding.vulnerabilitySurface || "-")}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <InsetCard className="text-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{locale === "zh" ? "判定" : "Verdict"}</div>
                    <div className="mt-2 text-slate-800">{String(finding.verdict || "-")}</div>
                  </InsetCard>
                  <InsetCard className="text-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{locale === "zh" ? "置信度" : "Confidence"}</div>
                    <div className="mt-2 text-slate-800">{String(finding.confidence ?? "-")}</div>
                  </InsetCard>
                  <InsetCard className="text-sm md:col-span-2">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{locale === "zh" ? "证据摘要" : "Evidence summary"}</div>
                    <div className="mt-2 text-slate-800">{String(finding.evidenceSummaryPreview || "-")}</div>
                  </InsetCard>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <InsetCard className="text-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{locale === "zh" ? "攻击输入摘要" : "Prompt summary"}</div>
                    <p className="mt-2 leading-7 text-slate-700">{String(finding.harmfulPromptPreview || "-")}</p>
                  </InsetCard>
                  <InsetCard className="text-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{locale === "zh" ? "关键证据" : "Smoking gun"}</div>
                    <p className="mt-2 leading-7 text-slate-700">{String(finding.smokingGunPreview || "-")}</p>
                  </InsetCard>
                  <InsetCard className="text-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{locale === "zh" ? "最终响应摘要" : "Final response summary"}</div>
                    <p className="mt-2 leading-7 text-slate-700">{String(finding.finalResponsePreview || "-")}</p>
                  </InsetCard>
                </div>
              </SurfaceCard>
            ))}
          </section>
        </div>

        <div className="grid gap-4">
          <AdminSubmissionActions
            submissionId={submission.publicId}
            locale={locale}
            currentStatus={submission.status}
            currentTitle={submission.publicCase?.title}
            currentSummary={submission.publicCase?.summary}
            currentSlug={submission.publicCase?.slug}
            currentVerificationSummary={submission.verificationSummary}
            hasPublicCase={Boolean(submission.publicCase)}
          />

          <SurfaceCard>
            <SectionHeading
              title={locale === "zh" ? "审核历史" : "Review history"}
              description={locale === "zh" ? "查看管理员对这条提交做过的状态变更。" : "View status changes made by admins for this submission."}
            />
            <div className="mt-4 grid gap-3">
              {submission.reviews.length ? (
                submission.reviews.map((review) => (
                  <InsetCard key={review.id} className="text-sm">
                    <div className="font-medium text-slate-900">
                      {review.reviewer.name || review.reviewer.githubLogin || "admin"} · {review.action}
                    </div>
                    <div className="mt-1 text-slate-500">{formatDate(locale, review.createdAt.toISOString())}</div>
                    <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">{review.notes || "-"}</p>
                  </InsetCard>
                ))
              ) : (
                <InsetCard className="text-sm text-slate-600">
                  {locale === "zh" ? "还没有审核记录。" : "No review records yet."}
                </InsetCard>
              )}
            </div>
          </SurfaceCard>
        </div>
      </section>
    </div>
  );
}
