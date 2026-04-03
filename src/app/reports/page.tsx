import Link from "next/link";

import {
  actionButtonClass,
  EmptyState,
  fieldClass,
  InsetCard,
  PageHero,
  SectionHeading,
  SurfaceCard,
} from "@/components/page-chrome";
import { RecentSubmissionShortcut } from "@/components/recent-submission-shortcut";
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
          title: "查询我的提交",
          body: "输入提交编号和查询回执，查看当前处理进度、平台反馈，以及是否已经发布为公开页面。",
          submissionId: "提交编号",
          trackingToken: "查询回执",
          lookup: "查询",
          status: "状态",
          submittedAt: "提交时间",
          reviewedAt: "处理时间",
          publishedAt: "发布时间",
          verificationSummary: "平台反馈",
          adminNotes: "补充说明",
          publicCase: "已发布结果",
          openPublicCase: "打开公开结果",
          missing: "先填写提交编号和查询回执。",
          helperTitle: "如何使用这页",
          helperBody: "正式提交后你会得到一份查询回执。这页就是用来查看它的当前进度。",
          helperKeep: "需要保存什么",
          helperKeepBody: "请保留提交编号和查询回执；没有这两个值就无法查看进度。",
          helperFlow: "标准流程",
          helperFlowBody: "上传 zip -> 检查可公开预览 -> 正式提交 -> 管理员审核 -> 发布公开页面",
          uploadAnother: "继续上传新报告",
          browseSkills: "浏览漏洞案例",
          receiptTitle: "查询回执",
          receiptBody: "建议把这份回执复制或下载保存，之后回来看进度时会用到。",
          latestState: "当前进度",
        }
      : {
          title: "Track my submission",
          body: "Enter your submission number and tracking receipt to see processing progress, platform feedback, and publication status.",
          submissionId: "Submission number",
          trackingToken: "Tracking receipt",
          lookup: "Lookup",
          status: "Status",
          submittedAt: "Submitted at",
          reviewedAt: "Updated at",
          publishedAt: "Published at",
          verificationSummary: "Platform feedback",
          adminNotes: "Additional note",
          publicCase: "Published result",
          openPublicCase: "Open published result",
          missing: "Provide your submission number and tracking receipt first.",
          helperTitle: "How to use this page",
          helperBody: "After formal submission you receive a tracking receipt. This page lets you check the latest status for that receipt.",
          helperKeep: "What to keep",
          helperKeepBody: "Save the submission number and tracking receipt. Without both values, the status cannot be retrieved.",
          helperFlow: "Typical flow",
          helperFlowBody: "Upload zip -> review the public preview -> submit -> admin review -> public page",
          uploadAnother: "Submit another report",
          browseSkills: "Browse vulnerabilities",
          receiptTitle: "Tracking receipt",
          receiptBody: "Copy or download this receipt now so you can check progress again later.",
          latestState: "Current state",
        };

  return (
    <div className="grid gap-6">
      <PageHero
        tone="dark"
        eyebrow={locale === "zh" ? "查询入口" : "Tracking portal"}
        title={copy.title}
        description={copy.body}
        aside={
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <InsetCard tone="white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "你需要准备" : "You need"}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-700">
                {locale === "zh" ? "提交编号 + 查询回执" : "Submission number + tracking receipt"}
              </div>
            </InsetCard>
            <InsetCard tone="tint">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "可查看内容" : "Visible here"}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-700">
                {locale === "zh" ? "当前进度、平台反馈、公开页面链接" : "Current status, platform feedback, and public page links"}
              </div>
            </InsetCard>
          </div>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] xl:items-start">
        <div className="grid gap-6">
          <SurfaceCard className="grid gap-5">
            <SectionHeading title={copy.title} description={copy.body} />
            {!id || !token ? <RecentSubmissionShortcut locale={locale} /> : null}
            <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <input
                name="id"
                defaultValue={id}
                placeholder={copy.submissionId}
                className={fieldClass("input")}
              />
              <input
                name="token"
                defaultValue={token}
                placeholder={copy.trackingToken}
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
            ) : !id || !token ? (
              <div className="border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {copy.missing}
              </div>
            ) : null}
          </SurfaceCard>

          {result ? (
            <SurfaceCard className="grid gap-4">
              <div className="text-sm font-medium text-slate-500">{copy.latestState}</div>
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
          {id && token ? (
            <ReceiptPanel
              locale={locale}
              title={copy.receiptTitle}
              description={copy.receiptBody}
              filenamePrefix="skillatlas-tracking-receipt"
              fields={[
                { label: copy.submissionId, value: id },
                { label: copy.trackingToken, value: token },
              ]}
            />
          ) : null}

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
              <Link href="/vulnerabilities" className={actionButtonClass("secondary")}>
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
