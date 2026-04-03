"use client";

import Link from "next/link";
import { useState } from "react";

import {
  actionButtonClass,
  fieldClass,
  InsetCard,
  PageHero,
  SectionHeading,
  SurfaceCard,
} from "@/components/page-chrome";
import { PublicVulnerabilityCard } from "@/components/public-vulnerability-card";
import { ReceiptPanel } from "@/components/receipt-panel";
import type { Locale } from "@/lib/i18n";
import {
  formatSubmissionStatusLabel,
  getFriendlyHiddenSectionLabel,
  parseSkillPresentation,
} from "@/lib/public-presentation";
import type { PublicVulnerabilitySummary } from "@/lib/server/public-skills";
import { LAST_SUBMISSION_STORAGE_KEY } from "@/lib/submission-receipt";
import type { ParsedBundleDisplay } from "@/lib/server/report-bundle-parser";

interface UploadDisplayState {
  submissionId: string;
  status: string;
  submittedAt?: string | Date | null;
  display: ParsedBundleDisplay;
  redactionSummary?: unknown;
  dedupedFromSubmissionId?: string | null;
}

interface GuestUploadFormProps {
  locale: Locale;
  initialDisplay?: UploadDisplayState | null;
  initialError?: string | null;
}

function formatDate(locale: Locale, value?: string | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizePreviewResult(verdict?: string | null) {
  switch (String(verdict || "").trim().toLowerCase()) {
    case "success":
    case "attack_success":
      return "success";
    case "technical":
      return "technical";
    case "ignore":
    case "ignored":
      return "ignore";
    default:
      return "pending";
  }
}

function createPreviewCard(
  displayState: UploadDisplayState,
  finding: ParsedBundleDisplay["findings"][number],
  index: number
): PublicVulnerabilitySummary {
  const presentation = parseSkillPresentation(finding.reportSkillId);
  const agentModel = String(finding.model || finding.provider || "").trim();
  const submittedAt = displayState.submittedAt ? new Date(displayState.submittedAt) : null;
  const surfaceId = String(finding.findingKey || `finding-${index + 1}`);
  const finalReason =
    String(finding.evidenceSummaryPreview || "").trim() ||
    String(finding.finalResponsePreview || "").trim() ||
    String(finding.smokingGunPreview || "").trim() ||
    String(finding.harmfulPromptPreview || "").trim();

  return {
    id: `${displayState.submissionId}:${surfaceId}:${agentModel || "unknown"}:${index}`,
    slug: `preview-${displayState.submissionId}-${surfaceId}-${index}`,
    skillId: finding.reportSkillId,
    skillLabel: presentation.skillLabel,
    ownerLabel: presentation.ownerLabel,
    ordinal: presentation.ordinal,
    skillDisplayName: presentation.targetLabel || presentation.skillLabel || finding.reportSkillId,
    surfaceId,
    surfaceOrdinal: presentation.ordinal,
    surfaceTitle:
      String(finding.vulnerabilitySurface || "").trim() ||
      String(finding.harmType || "").trim() ||
      surfaceId,
    surfaceLevel: String(finding.reasonCode || "").trim() || "Pending",
    result: normalizePreviewResult(finding.verdict),
    riskType: String(finding.harmType || "").trim() || "-",
    roundCount: Array.isArray(finding.trajectoryTimeline) ? finding.trajectoryTimeline.length : 0,
    updatedAt: submittedAt,
    attackPrompt: String(finding.harmfulPromptPreview || "").trim(),
    latestAttackPrompt: String(finding.harmfulPromptPreview || "").trim(),
    finalReason,
    finalRoundId: null,
    agentModel: agentModel || "-",
    models: agentModel ? [agentModel] : [],
  };
}

export function GuestUploadForm({
  locale,
  initialDisplay = null,
  initialError = null,
}: GuestUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(initialError);
  const [displayState, setDisplayState] = useState<UploadDisplayState | null>(initialDisplay);
  const [submitterLabel, setSubmitterLabel] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");

  const copy =
    locale === "zh"
        ? {
          title: "提交轨迹报告",
          body: "",
          chooseFile: "选择 zip 文件",
          upload: "上传并提交",
          uploading: "上传中...",
          replace: "重新上传其他文件",
          display: "提交结果",
          displayBody: "这里显示脱敏后的摘要。",
          bundleSummary: "结果概览",
          reportCount: "对象数",
          findingCount: "漏洞条目",
          redaction: "隐私处理",
          hiddenSections: "不会公开的内容",
          replacements: "已隐藏的敏感信息",
          submitterLabel: "你的称呼（可选）",
          contactEmail: "联系邮箱（可选）",
          notes: "给管理员的备注（可选）",
          tracking: "提交编号",
          trackingBody: "保存这个编号，用来查询进度。",
          openTracker: "查询进度",
          skill: "受影响对象",
          verdict: "判定",
          confidence: "置信度",
          evidence: "证据摘要",
          harmfulPrompt: "攻击输入摘要",
          smokingGun: "关键证据",
          finalResponse: "最终响应摘要",
          generated: "生成时间",
          submittedAt: "提交时间",
          status: "状态",
          submissionId: "提交编号",
          uploadPanel: "上传报告",
          uploadPanelBody: "上传后将会显示脱敏后的轨迹信息，内容在审核通过前不会公开。",
          privacyEyebrow: "报告内容",
          privacyPanel: "提交摘要",
          privacyBody: "此处显示脱敏后的摘要信息。",
          privacyNote: "内容在审核通过前不会公开。",
          reviewPanel: "查询进度",
          reviewBody: "上传后可用提交编号查询进度。",
          browseTracker: "去查询页",
          trackingReceiptTitle: "提交回执",
          trackingReceiptBody: "保存这个编号，后续查询会用到。",
          copyHint: "可复制或下载保存。",
          dedupeNotice: "检测到相同 zip，已复用解析结果，并生成新的提交编号。",
          stepOne: "上传 zip 文件",
          stepTwo: "生成摘要",
          stepThree: "获得提交编号",
        }
      : {
          title: "Submit a vulnerability report",
          body: "",
          chooseFile: "Choose zip file",
          upload: "Upload and submit",
          uploading: "Uploading...",
          replace: "Upload another file",
          display: "Submission result",
          displayBody: "This page shows a redacted summary.",
          bundleSummary: "Summary",
          reportCount: "Targets",
          findingCount: "Findings",
          redaction: "Redactions",
          hiddenSections: "What stays private",
          replacements: "Hidden details",
          submitterLabel: "Display name (optional)",
          contactEmail: "Contact email (optional)",
          notes: "Note to admin (optional)",
          tracking: "Submission number",
          trackingBody: "Save this number to track progress.",
          openTracker: "Track progress",
          skill: "Affected target",
          verdict: "Verdict",
          confidence: "Confidence",
          evidence: "Evidence summary",
          harmfulPrompt: "Prompt summary",
          smokingGun: "Smoking gun",
          finalResponse: "Final response summary",
          generated: "Generated at",
          submittedAt: "Submitted at",
          status: "Status",
          submissionId: "Submission number",
          uploadPanel: "Upload report",
          uploadPanelBody:
            "After upload, a redacted trace summary will be shown here. It stays private until review is complete.",
          privacyEyebrow: "Report content",
          privacyPanel: "Submission summary",
          privacyBody: "A redacted summary is shown here.",
          privacyNote: "It stays private until review is complete.",
          reviewPanel: "Track progress",
          reviewBody: "Use your submission number to check progress.",
          browseTracker: "Open tracker",
          trackingReceiptTitle: "Submission receipt",
          trackingReceiptBody: "Save this number for later.",
          copyHint: "You can copy or download it.",
          dedupeNotice:
            "An identical zip was found. The existing parsed result was reused and a new submission number was issued.",
          stepOne: "Upload the zip file",
          stepTwo: "Generate the summary",
          stepThree: "Get the submission number",
        };
  const heroTitleClassName =
    locale === "zh"
      ? "max-w-none text-[2.25rem] font-semibold leading-[1.04] tracking-[-0.055em] text-slate-950 sm:text-[2.45rem] lg:text-[2.6rem]"
      : "max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl";
  const primarySurfaceClass = "grid gap-5 border-slate-200 bg-white shadow-none";
  const secondarySurfaceClass = "grid gap-4 border-slate-200 bg-white shadow-none";
  const fileInputClass = `${fieldClass("input")} file:mr-4 file:border-0 file:bg-[#11284e] file:px-4 file:py-3 file:text-sm file:font-medium file:text-white hover:file:bg-[#0d1f3b]`;

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError(locale === "zh" ? "请先选择 zip 文件。" : "Choose a zip file first.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("bundle", file);
      formData.append("source", "web");
      formData.append("submitterLabel", submitterLabel);
      formData.append("contactEmail", contactEmail);
      formData.append("submissionNotes", submissionNotes);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Upload failed.");
      }

      setDisplayState(json);
      window.sessionStorage.setItem(
        LAST_SUBMISSION_STORAGE_KEY,
        JSON.stringify({
          submissionId: json.submissionId,
        })
      );
      const url = new URL(window.location.href);
      url.searchParams.set("id", json.submissionId);
      window.history.replaceState({}, "", url.toString());
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function resetFlow() {
    setFile(null);
    setDisplayState(null);
    setError(null);
    window.sessionStorage.removeItem(LAST_SUBMISSION_STORAGE_KEY);
    const url = new URL(window.location.href);
    url.searchParams.delete("id");
    window.history.replaceState({}, "", url.toString());
  }

  const findings = displayState?.display.findings || [];
  const reports = displayState?.display.reports || [];
  const findingCards = displayState
    ? findings.map((finding, index) => createPreviewCard(displayState, finding, index))
    : [];
  const redactionSummary = displayState?.display.redactionSummary ?? {
    flags: [],
    replacements: {},
    hiddenSections: [],
  };
  const totalRedactions = Object.values(redactionSummary.replacements).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );

  return (
    <div className="grid gap-8">
      <PageHero
        tone="dark"
        title={copy.title}
        titleClassName={heroTitleClassName}
        description={copy.body}
        actionsLayout="side"
        className="py-5 sm:py-6"
        actions={
          <>
            <Link href="/reports" className={actionButtonClass("primary")}>
              {copy.browseTracker}
            </Link>
            <Link href="/vulnerabilities" className={actionButtonClass("secondary")}>
              {locale === "zh" ? "浏览攻击轨迹" : "Browse attack traces"}
            </Link>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.72fr)_minmax(20rem,0.88fr)] xl:items-start">
        <div className="grid gap-6">
          <SurfaceCard className={primarySurfaceClass}>
            <SectionHeading title={copy.uploadPanel} description={copy.uploadPanelBody} />
            <div className="grid gap-4 border border-slate-200 bg-[linear-gradient(180deg,#fbfdff,#f2f7fc)] p-5">
              <div className="text-sm leading-7 text-slate-600">
                {locale === "zh"
                  ? "这里只显示脱敏后的摘要。"
                  : "Only a redacted summary is shown here."}
              </div>

              <form onSubmit={handleUpload} className="grid gap-4">
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-slate-700">{copy.chooseFile}</span>
                  <input
                    type="file"
                    accept=".zip,application/zip"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                    className={fileInputClass}
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-slate-700">{copy.submitterLabel}</span>
                    <input
                      value={submitterLabel}
                      onChange={(event) => setSubmitterLabel(event.target.value)}
                      className={fieldClass("input")}
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-slate-700">{copy.contactEmail}</span>
                    <input
                      value={contactEmail}
                      onChange={(event) => setContactEmail(event.target.value)}
                      className={fieldClass("input")}
                    />
                  </label>
                </div>
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-slate-700">{copy.notes}</span>
                  <textarea
                    value={submissionNotes}
                    onChange={(event) => setSubmissionNotes(event.target.value)}
                    className={fieldClass("textarea")}
                  />
                </label>
                <div className="flex flex-wrap items-end gap-3">
                  <button type="submit" disabled={uploading} className={actionButtonClass("primary")}>
                    {uploading ? copy.uploading : copy.upload}
                  </button>
                  {displayState ? (
                    <button type="button" onClick={resetFlow} className={actionButtonClass("secondary")}>
                      {copy.replace}
                    </button>
                  ) : null}
                </div>
              </form>

              {error ? (
                <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  {error}
                </div>
              ) : null}
            </div>
          </SurfaceCard>

          {displayState ? (
            <SurfaceCard className="grid gap-6 border-slate-200 bg-white shadow-none">
              <SectionHeading
                title={copy.display}
                description={copy.displayBody}
                action={
                  <Link
                    href={`/reports?id=${encodeURIComponent(displayState.submissionId)}`}
                    className={actionButtonClass("primary")}
                  >
                    {copy.openTracker}
                  </Link>
                }
              />

              <div className="grid gap-4">
                <div className="grid gap-3 lg:grid-cols-5">
                  <InsetCard tone="white" className="text-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.status}</div>
                    <div className="mt-2 font-medium text-slate-800">
                      {formatSubmissionStatusLabel(locale, displayState.status)}
                    </div>
                  </InsetCard>
                  <InsetCard tone="white" className="text-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.generated}</div>
                    <div className="mt-2 font-medium text-slate-800">
                      {formatDate(locale, displayState.display.bundle.generatedAt)}
                    </div>
                  </InsetCard>
                  <InsetCard tone="white" className="text-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.submittedAt}</div>
                    <div className="mt-2 font-medium text-slate-800">
                      {formatDate(locale, String(displayState.submittedAt || ""))}
                    </div>
                  </InsetCard>
                  <InsetCard tone="white" className="text-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.reportCount}</div>
                    <div className="mt-2 font-medium text-slate-800">
                      {new Set(reports.map((report) => report.skillId).filter(Boolean)).size}
                    </div>
                  </InsetCard>
                  <InsetCard tone="white" className="text-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.findingCount}</div>
                    <div className="mt-2 font-medium text-slate-800">{findings.length}</div>
                  </InsetCard>
                </div>

                <InsetCard className="grid gap-4 border-slate-200 bg-[linear-gradient(180deg,#fbfdff,#f2f7fc)] p-5">
                  <h3 className="text-lg font-semibold">{copy.bundleSummary}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InsetCard tone="white" className="text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.submissionId}</div>
                      <div className="mt-2 break-all font-medium text-slate-800">{displayState.submissionId}</div>
                    </InsetCard>
                    <InsetCard tone="white" className="text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        {locale === "zh" ? "当前说明" : "Current summary"}
                      </div>
                      <p className="mt-2 leading-7 text-slate-700">
                        {locale === "zh"
                          ? "下面是本次上传的摘要。"
                          : "Below is the summary for this upload."}
                      </p>
                    </InsetCard>
                  </div>
                </InsetCard>

                <InsetCard className="border-slate-200 bg-[linear-gradient(180deg,#fbfdff,#f2f7fc)] p-5">
                  <h3 className="text-lg font-semibold">{copy.redaction}</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <InsetCard tone="white" className="text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.hiddenSections}</div>
                      <div className="mt-2 grid gap-2">
                        {redactionSummary.hiddenSections.map((item) => (
                          <div key={item} className="border border-slate-300 bg-slate-100 px-3 py-1 text-xs text-slate-700">
                            {getFriendlyHiddenSectionLabel(locale, item)}
                          </div>
                        ))}
                      </div>
                    </InsetCard>
                    <InsetCard tone="white" className="text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.replacements}</div>
                      <div className="mt-2 border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
                        {locale === "zh"
                          ? `已隐藏 ${totalRedactions} 处敏感信息。`
                          : `${totalRedactions} sensitive details were hidden.`}
                      </div>
                      <div className="mt-3 grid gap-2">
                        {Object.entries(redactionSummary.replacements).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between border border-slate-300 bg-slate-100 px-3 py-1 text-xs text-slate-700">
                            <span>{key}</span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    </InsetCard>
                  </div>
                  {redactionSummary.flags.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {redactionSummary.flags.map((flag) => (
                        <span key={flag} className="border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                          {flag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </InsetCard>

                <div className="grid gap-3">
                  <div className="grid gap-1">
                    <h3 className="text-lg font-semibold text-slate-950">
                      {locale === "zh" ? "漏洞卡片预览" : "Vulnerability card preview"}
                    </h3>
                    <p className="text-sm leading-7 text-slate-600">
                      {locale === "zh"
                        ? "这些条目会按这份摘要进入审核和公开页。"
                        : "These findings will be reviewed and published from this summary."}
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {findingCards.map((item) => (
                      <PublicVulnerabilityCard
                        key={item.id}
                        locale={locale}
                        item={item}
                        variant="list"
                        density="compact"
                        combineRiskAndModel
                        metaLayout="band"
                        accentBackground
                        showDetailButton={false}
                        showPrompt={false}
                        showFinalReason
                        finalReasonLabel={copy.evidence}
                        finalReasonLength={320}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </SurfaceCard>
          ) : null}
        </div>

        <div className="grid gap-4 xl:sticky xl:top-24">
          {!displayState ? (
            <>
              <SurfaceCard className={secondarySurfaceClass}>
                <div className="grid gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {locale === "zh" ? "上传之后" : "After upload"}
                  </div>
                  <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-slate-950">
                    {copy.reviewPanel}
                  </h2>
                  <p className="text-sm leading-7 text-slate-600">{copy.reviewBody}</p>
                </div>
                <div className="grid gap-2">
                  <InsetCard tone="white" className="text-sm text-slate-700">
                    {copy.stepOne}
                  </InsetCard>
                  <InsetCard tone="white" className="text-sm text-slate-700">
                    {copy.stepTwo}
                  </InsetCard>
                  <InsetCard tone="tint" className="text-sm text-slate-700">
                    {copy.stepThree}
                  </InsetCard>
                </div>
                <Link href="/reports" className={actionButtonClass("secondary")}>
                  {copy.browseTracker}
                </Link>
              </SurfaceCard>

              <SurfaceCard className={secondarySurfaceClass}>
                <div className="grid gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {copy.privacyEyebrow}
                  </div>
                  <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-slate-950">
                    {copy.privacyPanel}
                  </h2>
                  <p className="text-sm leading-7 text-slate-600">{copy.privacyBody}</p>
                </div>
                <InsetCard tone="white" className="text-sm leading-7 text-slate-700">
                  {copy.privacyNote}
                </InsetCard>
              </SurfaceCard>
            </>
          ) : (
            <>
              <ReceiptPanel
                locale={locale}
                title={copy.trackingReceiptTitle}
                description={`${copy.trackingReceiptBody} ${copy.copyHint}`}
                filenamePrefix="skillatlas-submission-receipt"
                fields={[
                  { label: copy.submissionId, value: displayState.submissionId },
                ]}
              />
              <SurfaceCard className={secondarySurfaceClass}>
                <div className="grid gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {locale === "zh" ? "接下来" : "Next"}
                  </div>
                  <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-slate-950">
                    {copy.tracking}
                  </h2>
                  <p className="text-sm leading-7 text-slate-600">{copy.trackingBody}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/reports?id=${encodeURIComponent(displayState.submissionId)}`}
                    className={actionButtonClass("success")}
                  >
                    {copy.openTracker}
                  </Link>
                  <Link href="/vulnerabilities" className={actionButtonClass("secondary")}>
                    {locale === "zh" ? "浏览公开案例" : "Browse public cases"}
                  </Link>
                </div>
                <InsetCard tone="white" className="text-sm leading-7 text-slate-700">
                  {copy.copyHint}
                </InsetCard>
                {displayState.dedupedFromSubmissionId ? (
                  <InsetCard tone="tint" className="text-sm leading-7 text-slate-700">
                    {copy.dedupeNotice}
                  </InsetCard>
                ) : null}
              </SurfaceCard>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
