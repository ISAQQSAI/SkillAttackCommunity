import Link from "next/link";

import {
  actionButtonClass,
  EmptyState,
  fieldClass,
  InsetCard,
  PageHero,
  SurfaceCard,
} from "@/components/page-chrome";
import { SubmissionStatusBadge } from "@/components/submission-status-badge";
import { getLocale } from "@/lib/server/locale";
import { requireRole } from "@/lib/server/auth";
import { listAdminSubmissions } from "@/lib/server/report-submissions";
import type { SubmissionStatus } from "@/lib/submission-ui";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();

  try {
    await requireRole(["admin"]);
  } catch {
    return (
      <EmptyState
        title={locale === "zh" ? "只有管理员可以查看审核队列" : "Admin access required"}
        body={locale === "zh" ? "请使用管理员身份登录后再查看审核队列。" : "Sign in as an admin to view the review queue."}
      />
    );
  }

  const params = await searchParams;
  const status = first(params.status);
  const submissions = await listAdminSubmissions();
  const filtered = status ? submissions.filter((item) => item.status === status) : submissions;

  return (
    <div className="grid gap-6">
      <PageHero
        tone="dark"
        eyebrow={locale === "zh" ? "Admin workflow" : "Admin workflow"}
        title={locale === "zh" ? "管理员审核队列" : "Admin review queue"}
        description={
          locale === "zh"
            ? "查看所有正式提交，下载原始 bundle，检查脱敏结果，并决定拒绝，或审核通过后直接公开。"
            : "Review submitted bundles, download raw archives, inspect the sanitized findings, and either reject them or publish them immediately."
        }
        aside={
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <InsetCard tone="white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "总提交数" : "Total submissions"}
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">{submissions.length}</div>
            </InsetCard>
            <InsetCard tone="tint">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "当前筛选" : "Current filter"}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-700">{status || (locale === "zh" ? "全部状态" : "all statuses")}</div>
            </InsetCard>
          </div>
        }
      />

      <SurfaceCard>
        <form className="grid gap-4 md:grid-cols-[1fr_auto]">
          <input
            name="status"
            defaultValue={status}
            placeholder={locale === "zh" ? "按状态筛选" : "Filter by status"}
            className={fieldClass("input")}
          />
          <button className={actionButtonClass("primary")}>
            {locale === "zh" ? "筛选" : "Filter"}
          </button>
        </form>
      </SurfaceCard>

      <section className="grid gap-4">
        {filtered.map((submission) => {
          const firstFinding = submission.findings[0];
          return (
            <Link
              key={submission.publicId}
              href={`/review/${submission.publicId}`}
              className="group grid gap-4 border border-slate-200 bg-white p-5 transition hover:border-slate-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <SubmissionStatusBadge
                    status={submission.status as SubmissionStatus}
                    locale={locale}
                  />
                  <span className="border border-slate-300 bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">
                    {submission.publicId}
                  </span>
                </div>
                <span className="text-sm text-slate-500">
                  {submission._count.findings} {locale === "zh" ? "个 findings" : "findings"}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em] transition group-hover:text-slate-950">
                  {submission.originalFilename}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {firstFinding
                    ? `${firstFinding.reportSkillId} · ${firstFinding.harmType} · ${firstFinding.model || "-"}`
                    : locale === "zh"
                      ? "该 bundle 未解析出 findings。"
                      : "No findings were extracted from this bundle."}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <InsetCard className="text-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {locale === "zh" ? "提交者" : "Submitter"}
                  </div>
                  <div className="mt-2 text-slate-700">{submission.submitterLabel || "-"}</div>
                </InsetCard>
                <InsetCard className="text-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {locale === "zh" ? "联系方式" : "Contact"}
                  </div>
                  <div className="mt-2 break-all text-slate-700">{submission.contactEmail || "-"}</div>
                </InsetCard>
                <InsetCard className="text-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {locale === "zh" ? "脱敏状态" : "Redaction"}
                  </div>
                  <div className="mt-2 text-slate-700">
                    {submission.redactionSummary && typeof submission.redactionSummary === "object"
                      ? locale === "zh"
                        ? "含脱敏摘要"
                        : "redaction summary"
                      : locale === "zh"
                        ? "无脱敏摘要"
                        : "no redaction summary"}
                  </div>
                </InsetCard>
              </div>
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                {submission.submitterLabel ? (
                  <span className="border border-slate-300 bg-slate-50 px-3 py-1">{submission.submitterLabel}</span>
                ) : null}
                {submission.contactEmail ? (
                  <span className="border border-slate-300 bg-slate-50 px-3 py-1">{submission.contactEmail}</span>
                ) : null}
                <span className="border border-slate-300 bg-slate-50 px-3 py-1">
                  {submission.redactionSummary && typeof submission.redactionSummary === "object"
                    ? locale === "zh"
                      ? "含脱敏规则"
                      : "redaction summary"
                    : locale === "zh"
                      ? "无脱敏摘要"
                      : "no redaction summary"}
                </span>
              </div>
            </Link>
          );
        })}
        {!filtered.length ? (
          <EmptyState
            title={locale === "zh" ? "没有匹配的提交流水" : "No matching submissions"}
            body={locale === "zh" ? "调整状态筛选后再试一次。" : "Try a different status filter."}
          />
        ) : null}
      </section>
    </div>
  );
}
