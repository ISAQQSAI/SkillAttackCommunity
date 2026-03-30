import Link from "next/link";

import {
  actionButtonClass,
  EmptyState,
  InsetCard,
  PageHero,
  SectionHeading,
  SurfaceCard,
} from "@/components/page-chrome";
import { SubmissionStatusBadge } from "@/components/submission-status-badge";
import { getLocale } from "@/lib/server/locale";
import { getSubmissionStatus } from "@/lib/server/report-submissions";
import type { SubmissionStatus } from "@/lib/submission-ui";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const id = first(params.id);
  const token = first(params.token);

  let result:
    | Awaited<ReturnType<typeof getSubmissionStatus>>
    | null = null;
  let error: string | null = null;

  if (id && token) {
    try {
      result = await getSubmissionStatus(id, token);
    } catch (statusError) {
      error = statusError instanceof Error ? statusError.message : "Could not load submission.";
    }
  }

  const copy =
    locale === "zh"
      ? {
          title: "查询提交状态",
          body: "输入 submission ID 和 tracking token，查看审核状态、管理员结论和是否已经发布。",
          submissionId: "Submission ID",
          trackingToken: "Tracking Token",
          lookup: "查询",
          status: "状态",
          submittedAt: "提交时间",
          reviewedAt: "审核时间",
          publishedAt: "发布时间",
          verificationSummary: "审核结论",
          adminNotes: "管理员备注",
          publicCase: "公开案例页",
          openPublicCase: "打开案例详情",
          missing: "先填写 submission ID 和 tracking token。",
          helperTitle: "查询说明",
          helperBody: "这页适合 guest 用回执追踪审核进度。正式提交后拿到的 submission ID 和 tracking token 都可以在这里使用。",
          helperKeep: "需要保留的内容",
          helperKeepBody: "请保存 submission ID 和 tracking token；没有这两个值就无法查询提交进度。",
          helperFlow: "典型流程",
          helperFlowBody: "上传 bundle -> 生成预览 -> 正式提交 -> 管理员审核 -> 公开案例页",
          uploadAnother: "上传新的 bundle",
          browseSkills: "浏览技能案例",
        }
      : {
          title: "Track submission",
          body: "Enter your submission ID and tracking token to check review state, admin notes, and publication status.",
          submissionId: "Submission ID",
          trackingToken: "Tracking token",
          lookup: "Lookup",
          status: "Status",
          submittedAt: "Submitted at",
          reviewedAt: "Reviewed at",
          publishedAt: "Published at",
          verificationSummary: "Verification summary",
          adminNotes: "Admin notes",
          publicCase: "Public case page",
          openPublicCase: "Open case detail",
          missing: "Provide a submission ID and tracking token first.",
          helperTitle: "Tracking notes",
          helperBody: "This page is for guest receipt-based tracking. Use the submission ID and tracking token you received after formal submission.",
          helperKeep: "Keep these values",
          helperKeepBody: "Save the submission ID and tracking token. Without both values, the submission status cannot be retrieved.",
          helperFlow: "Typical flow",
          helperFlowBody: "Upload bundle -> preview -> formal submit -> admin review -> public case page",
          uploadAnother: "Upload another bundle",
          browseSkills: "Browse public skills",
        };

  return (
    <div className="grid gap-6">
      <PageHero
        tone="dark"
        eyebrow={locale === "zh" ? "Tracking portal" : "Tracking portal"}
        title={copy.title}
        description={copy.body}
        aside={
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <InsetCard tone="white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "你需要准备" : "You need"}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-700">
                {locale === "zh" ? "Submission ID + Tracking Token" : "Submission ID + tracking token"}
              </div>
            </InsetCard>
            <InsetCard tone="tint">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "可查看内容" : "Visible here"}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-700">
                {locale === "zh" ? "审核状态、管理员结论、公开案例链接" : "Review state, admin notes, and public case links"}
              </div>
            </InsetCard>
          </div>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] xl:items-start">
        <div className="grid gap-6">
          <SurfaceCard className="grid gap-5">
            <SectionHeading title={copy.title} description={copy.body} />
            <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <input
                name="id"
                defaultValue={id}
                placeholder={copy.submissionId}
                className="w-full rounded-[1.15rem] border border-black/10 bg-white/92 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
              />
              <input
                name="token"
                defaultValue={token}
                placeholder={copy.trackingToken}
                className="w-full rounded-[1.15rem] border border-black/10 bg-white/92 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
              />
              <button className={actionButtonClass("primary")}>
                {copy.lookup}
              </button>
            </form>
            {error ? (
              <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {error}
              </div>
            ) : !id || !token ? (
              <div className="rounded-[1.2rem] border border-dashed border-black/10 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {copy.missing}
              </div>
            ) : null}
          </SurfaceCard>

          {result ? (
            <SurfaceCard className="grid gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <SubmissionStatusBadge
                  status={result.status as SubmissionStatus}
                  locale={locale}
                />
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">
                  {result.submissionId}
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <InsetCard className="text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.submittedAt}</div>
                  <div className="mt-2 text-slate-800">{formatDate(locale, result.submittedAt)}</div>
                </InsetCard>
                <InsetCard className="text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.reviewedAt}</div>
                  <div className="mt-2 text-slate-800">{formatDate(locale, result.reviewedAt)}</div>
                </InsetCard>
                <InsetCard className="text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.publishedAt}</div>
                  <div className="mt-2 text-slate-800">{formatDate(locale, result.publishedAt)}</div>
                </InsetCard>
              </div>
              <InsetCard className="text-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.verificationSummary}</div>
                <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">
                  {result.verificationSummary || "-"}
                </p>
              </InsetCard>
              <InsetCard className="text-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.adminNotes}</div>
                <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">
                  {result.adminNotes || "-"}
                </p>
              </InsetCard>
            </SurfaceCard>
          ) : null}
        </div>

        <div className="grid gap-4 xl:sticky xl:top-24">
          <SurfaceCard className="grid gap-4">
            <SectionHeading title={copy.helperTitle} description={copy.helperBody} />
            <InsetCard tone="white" className="text-sm">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.helperKeep}</div>
              <p className="mt-2 leading-7 text-slate-700">{copy.helperKeepBody}</p>
            </InsetCard>
            <InsetCard tone="tint" className="text-sm">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.helperFlow}</div>
              <p className="mt-2 leading-7 text-slate-700">{copy.helperFlowBody}</p>
            </InsetCard>
            <div className="flex flex-wrap gap-3">
              <Link href="/submit" className={actionButtonClass("primary")}>
                {copy.uploadAnother}
              </Link>
              <Link href="/skills" className={actionButtonClass("secondary")}>
                {copy.browseSkills}
              </Link>
            </div>
          </SurfaceCard>

          <SurfaceCard className="grid gap-4">
            <h2 className="text-2xl font-semibold tracking-[-0.04em]">{copy.publicCase}</h2>
            {result?.publicCase ? (
              <>
                <InsetCard>
                  <h3 className="text-lg font-semibold">{result.publicCase.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatDate(locale, result.publicCase.publishedAt)}
                  </p>
                </InsetCard>
                <Link
                  href={result.publicCase.path}
                  className={actionButtonClass("primary")}
                >
                  {copy.openPublicCase}
                </Link>
              </>
            ) : (
              <EmptyState
                title={locale === "zh" ? "还没有公开案例" : "No public case yet"}
                body={locale === "zh" ? "提交通过审核并发布后，这里会出现可公开访问的案例详情入口。" : "A public case link will appear here after admin approval and publication."}
              />
            )}
          </SurfaceCard>
        </div>
      </section>
    </div>
  );
}
