import Link from "next/link";

import {
  actionButtonClass,
  fieldClass,
  InsetCard,
  PageHero,
  SectionHeading,
  SurfaceCard,
} from "@/components/page-chrome";
import { ReceiptPanel } from "@/components/receipt-panel";
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

  let result:
    | Awaited<ReturnType<typeof getSubmissionStatus>>
    | null = null;
  let error: string | null = null;

  if (id) {
    try {
      result = await getSubmissionStatus(id);
    } catch (statusError) {
      error = statusError instanceof Error ? statusError.message : "Could not load submission.";
    }
  }

  const copy =
    locale === "zh"
      ? {
          title: "查询提交",
          body: "输入提交编号即可查看进度。",
          submissionId: "提交编号",
          lookup: "查询",
          status: "状态",
          submittedAt: "提交时间",
          reviewedAt: "处理时间",
          publishedAt: "发布时间",
          verificationSummary: "反馈",
          adminNotes: "备注",
          missing: "请输入提交编号。",
          helperTitle: "查询方法",
          helperBody: "上传文件后，系统将生成提交编号。请使用提交编号查询审核进度。",
          helperKeep: "保存提示",
          helperKeepBody: "请妥善保存提交编号，以便随时查询。",
          helperFlow: "处理流程",
          helperFlowBody: "上传 ZIP 文件 → 获取提交编号 → 审核 → 公布",
          uploadAnother: "继续上传",
          browseSkills: "浏览轨迹",
          receiptTitle: "提交回执",
          receiptBody: "保存这个编号，后续查询会用到。",
          latestState: "当前状态",
        }
      : {
          title: "Track submission",
          body: "Enter your submission number to check status.",
          submissionId: "Submission number",
          lookup: "Lookup",
          status: "Status",
          submittedAt: "Submitted at",
          reviewedAt: "Updated at",
          publishedAt: "Published at",
          verificationSummary: "Feedback",
          adminNotes: "Note",
          missing: "Enter your submission number first.",
          helperTitle: "How to check",
          helperBody: "You get a submission number after upload. Use it to track progress.",
          helperKeep: "What to keep",
          helperKeepBody: "Save the submission number.",
          helperFlow: "Flow",
          helperFlowBody: "Upload zip -> get submission number -> review -> publish",
          uploadAnother: "Upload another",
          browseSkills: "Browse cases",
          receiptTitle: "Submission receipt",
          receiptBody: "Save this number for later.",
          latestState: "Status",
        };
  const heroTitleClassName =
    locale === "zh"
      ? "max-w-none text-[2.25rem] font-semibold leading-[1.04] tracking-[-0.055em] text-slate-950 sm:text-[2.45rem] lg:text-[2.6rem]"
      : "max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl";
  const primarySurfaceClass = "grid gap-5 border-slate-200 bg-white shadow-none";
  const secondarySurfaceClass = "grid gap-4 border-slate-200 bg-white shadow-none";

  return (
    <div className="grid gap-8">
      <PageHero
        tone="dark"
        title={copy.title}
        titleClassName={heroTitleClassName}
        actionsLayout="side"
        className="py-5 sm:py-6"
        actions={
          <>
            <Link href="/submit" className={actionButtonClass("primary")}>
              {copy.uploadAnother}
            </Link>
            <Link href="/vulnerabilities" className={actionButtonClass("secondary")}>
              {copy.browseSkills}
            </Link>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,0.9fr)] xl:items-start">
        <div className="grid gap-6">
          <SurfaceCard className={primarySurfaceClass}>
            <SectionHeading title={copy.title} description={copy.body} />
            <div className="grid gap-4 border border-slate-200 bg-[linear-gradient(180deg,#fbfdff,#f2f7fc)] p-5">
              <form className="grid gap-4 md:grid-cols-[1fr_auto]">
                <input
                  name="id"
                  defaultValue={id}
                  placeholder={copy.submissionId}
                  className={fieldClass("input")}
                />
                <button className={actionButtonClass("primary")}>
                  {copy.lookup}
                </button>
              </form>
              {error ? (
                <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  {error}
                </div>
              ) : !id ? (
                <div className="border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {copy.missing}
                </div>
              ) : null}
            </div>
          </SurfaceCard>

          {result ? (
            <SurfaceCard className="grid gap-5 border-slate-200 bg-white shadow-none">
              <SectionHeading
                title={copy.latestState}
                description={
                  locale === "zh"
                    ? "下面是当前状态和时间。"
                    : "Below are the current status and timestamps."
                }
              />
              <div className="flex flex-wrap items-center gap-3">
                <SubmissionStatusBadge
                  status={result.status as SubmissionStatus}
                  locale={locale}
                />
                <span className="border border-slate-300 bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">
                  {result.submissionId}
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <InsetCard tone="white" className="text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.submittedAt}</div>
                  <div className="mt-2 text-slate-800">{formatDate(locale, result.submittedAt)}</div>
                </InsetCard>
                <InsetCard tone="white" className="text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.reviewedAt}</div>
                  <div className="mt-2 text-slate-800">{formatDate(locale, result.reviewedAt)}</div>
                </InsetCard>
                <InsetCard tone="white" className="text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.publishedAt}</div>
                  <div className="mt-2 text-slate-800">{formatDate(locale, result.publishedAt)}</div>
                </InsetCard>
              </div>
              <InsetCard className="border-slate-200 bg-[linear-gradient(180deg,#fbfdff,#f2f7fc)] text-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.verificationSummary}</div>
                <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">
                  {result.verificationSummary || "-"}
                </p>
              </InsetCard>
              <InsetCard className="border-slate-200 bg-[linear-gradient(180deg,#fbfdff,#f2f7fc)] text-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.adminNotes}</div>
                <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">
                  {result.adminNotes || "-"}
                </p>
              </InsetCard>
            </SurfaceCard>
          ) : null}
        </div>

        <div className="grid gap-4 xl:sticky xl:top-24">
          {id ? (
            <ReceiptPanel
              locale={locale}
              title={copy.receiptTitle}
              description={copy.receiptBody}
              filenamePrefix="skillatlas-submission-receipt"
              fields={[
                { label: copy.submissionId, value: id },
              ]}
            />
          ) : null}

          <SurfaceCard className={secondarySurfaceClass}>
            <div className="grid gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                {locale === "zh" ? "使用说明" : "How it works"}
              </div>
              <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-slate-950">
                {copy.helperTitle}
              </h2>
              <p className="text-sm leading-7 text-slate-600">{copy.helperBody}</p>
            </div>
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
              <Link href="/vulnerabilities" className={actionButtonClass("secondary")}>
                {copy.browseSkills}
              </Link>
            </div>
          </SurfaceCard>
        </div>
      </section>
    </div>
  );
}
