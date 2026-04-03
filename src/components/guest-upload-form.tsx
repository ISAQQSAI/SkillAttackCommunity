"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  actionButtonClass,
  fieldClass,
  InsetCard,
  PageHero,
  SectionHeading,
  SurfaceCard,
} from "@/components/page-chrome";
import { ReceiptPanel } from "@/components/receipt-panel";
import type { Locale } from "@/lib/i18n";
import {
  formatSubmissionStatusLabel,
  formatVerdictLabel,
  getFriendlyHiddenSectionLabel,
  parseSkillPresentation,
} from "@/lib/public-presentation";
import { LAST_SUBMISSION_STORAGE_KEY } from "@/lib/submission-receipt";
import type { ParsedBundlePreview } from "@/lib/server/report-bundle-parser";

interface UploadPreviewState {
  submissionId: string;
  previewToken: string;
  status: string;
  previewReadyAt?: string | Date | null;
  preview: ParsedBundlePreview;
  redactionSummary?: unknown;
}

interface SubmitResultState {
  submissionId: string;
  status: string;
  submittedAt?: string | Date | null;
  trackingToken: string;
}

interface GuestUploadFormProps {
  locale: Locale;
  initialPreview?: UploadPreviewState | null;
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

export function GuestUploadForm({
  locale,
  initialPreview = null,
  initialError = null,
}: GuestUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(initialError);
  const [previewState, setPreviewState] = useState<UploadPreviewState | null>(initialPreview);
  const [submittedState, setSubmittedState] = useState<SubmitResultState | null>(null);
  const [submitterLabel, setSubmitterLabel] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");

  const copy =
    locale === "zh"
      ? {
          title: "提交漏洞报告",
          body:
            "直接上传 `report_bundle.zip`。系统会先生成一份可公开预览，让你确认展示内容没有问题；只有在你确认后，才会正式进入审核流程。",
          chooseFile: "选择 zip 文件",
          upload: "上传并查看预览",
          uploading: "解析中...",
          replace: "重新上传其他文件",
          preview: "可公开预览",
          previewBody:
            "下面这份内容就是公开页最终会展示的样子。你可以重点确认标题、影响摘要、证据摘要和对象信息是否适合公开。",
          bundleSummary: "公开预览概览",
          reportCount: "涉及对象",
          findingCount: "将公开的漏洞条目",
          redaction: "隐私处理概览",
          hiddenSections: "不会公开的内容",
          replacements: "自动隐藏的敏感信息",
          submitterLabel: "你的称呼（可选）",
          contactEmail: "联系邮箱（可选）",
          notes: "给管理员的备注（可选）",
          confirm: "确认并正式提交",
          submitting: "提交中...",
          tracking: "已生成查询回执",
          trackingBody:
            "下面这两项就是后续查询进度要用到的回执。建议你立刻复制或下载保存。",
          openTracker: "打开状态页",
          skill: "受影响对象",
          verdict: "判定",
          confidence: "置信度",
          evidence: "证据摘要",
          harmfulPrompt: "攻击输入摘要",
          smokingGun: "关键证据",
          finalResponse: "最终响应摘要",
          generated: "生成时间",
          status: "状态",
          previewToken: "预览回执",
          submissionId: "提交编号",
          trackingToken: "查询回执",
          uploadPanel: "上传入口",
          uploadPanelBody: "选择 zip 压缩包后，系统会先生成一份公开预览，不会直接展示任何原始内容。",
          privacyPanel: "上传前你会看到什么",
          privacyBody: "你会先检查公开预览，确认别人最终会看到的标题、摘要、对象和证据片段。",
          reviewPanel: "正式提交后",
          reviewBody: "你会拿到提交编号和查询回执，用它们在查询页查看进度、审核结论和公开状态。",
          submitPanel: "正式提交",
          submitPanelBody: "确认预览内容没有问题后，再补充可选信息并提交。",
          browseTracker: "打开查询页",
          previewReceiptTitle: "预览回执",
          previewReceiptBody: "如果你想稍后回来继续确认预览，先把这份回执保存下来。",
          trackingReceiptTitle: "查询回执",
          trackingReceiptBody: "后续查看审核进度就靠这份回执，建议复制并下载保存。",
          copyHint: "这份回执可以复制，也可以直接下载成文本保存。",
          stepOne: "上传 zip 文件",
          stepTwo: "检查可公开预览",
          stepThree: "提交并拿到查询回执",
        }
      : {
          title: "Submit a vulnerability report",
          body:
            "Upload `report_bundle.zip` directly. The server first builds a public preview for you to confirm, and only then sends the report into review.",
          chooseFile: "Choose zip file",
          upload: "Upload and preview",
          uploading: "Parsing bundle...",
          replace: "Upload another file",
          preview: "Public preview",
          previewBody:
            "This is what public readers will actually see. Focus on whether the title, impact summary, evidence summary, and target information feel safe to publish.",
          bundleSummary: "Public preview summary",
          reportCount: "Affected targets",
          findingCount: "Published vulnerabilities",
          redaction: "Privacy summary",
          hiddenSections: "What stays private",
          replacements: "Sensitive details hidden automatically",
          submitterLabel: "Display name (optional)",
          contactEmail: "Contact email (optional)",
          notes: "Note to admin (optional)",
          confirm: "Confirm and submit",
          submitting: "Submitting...",
          tracking: "Tracking receipt ready",
          trackingBody:
            "These two values are the receipt you will need later. Copy or download them now so you can check review progress at any time.",
          openTracker: "Open tracking page",
          skill: "Affected target",
          verdict: "Verdict",
          confidence: "Confidence",
          evidence: "Evidence summary",
          harmfulPrompt: "Prompt summary",
          smokingGun: "Smoking gun",
          finalResponse: "Final response summary",
          generated: "Generated at",
          status: "Status",
          previewToken: "Preview receipt",
          submissionId: "Submission number",
          trackingToken: "Tracking receipt",
          uploadPanel: "Upload entry",
          uploadPanelBody: "Choose your zip bundle and the server will build a public preview before anything enters review.",
          privacyPanel: "What you will review first",
          privacyBody: "You review the public-facing title, summary, target information, and evidence snippets before formal submission.",
          reviewPanel: "After formal submission",
          reviewBody: "You receive a submission number and tracking receipt for later status checks and publication updates.",
          submitPanel: "Formal submission",
          submitPanelBody: "Confirm the preview looks right, then add any optional context and submit.",
          browseTracker: "Open tracking page",
          previewReceiptTitle: "Preview receipt",
          previewReceiptBody: "Save this receipt if you want to come back later and continue from the same preview.",
          trackingReceiptTitle: "Tracking receipt",
          trackingReceiptBody: "Keep this receipt safe. You will use it to check progress and publication state later.",
          copyHint: "You can copy this receipt or download it as a text file.",
          stepOne: "Upload the zip file",
          stepTwo: "Review the public preview",
          stepThree: "Submit and keep the tracking receipt",
        };

  useEffect(() => {
    if (submittedState) {
      return;
    }

    const stored = window.sessionStorage.getItem(LAST_SUBMISSION_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as SubmitResultState;
      if (parsed.submissionId && parsed.trackingToken) {
        setSubmittedState(parsed);
      }
    } catch {
      window.sessionStorage.removeItem(LAST_SUBMISSION_STORAGE_KEY);
    }
  }, [submittedState]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError(locale === "zh" ? "请先选择 zip 文件。" : "Choose a zip file first.");
      return;
    }

    setUploading(true);
    setError(null);
    setSubmittedState(null);

    try {
      const formData = new FormData();
      formData.append("bundle", file);
      formData.append("source", "web");

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Upload failed.");
      }

      setPreviewState(json);
      const url = new URL(window.location.href);
      url.searchParams.set("id", json.submissionId);
      url.searchParams.set("previewToken", json.previewToken);
      window.history.replaceState({}, "", url.toString());
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFormalSubmit() {
    if (!previewState) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/uploads/${previewState.submissionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previewToken: previewState.previewToken,
          submitterLabel,
          contactEmail,
          submissionNotes,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Submit failed.");
      }

      setSubmittedState(json);
      window.sessionStorage.setItem(LAST_SUBMISSION_STORAGE_KEY, JSON.stringify(json));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetFlow() {
    setFile(null);
    setPreviewState(null);
    setSubmittedState(null);
    setError(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("id");
    url.searchParams.delete("previewToken");
    window.history.replaceState({}, "", url.toString());
  }

  const findings = previewState?.preview.findings || [];
  const reports = previewState?.preview.reports || [];
  const redactionSummary = previewState?.preview.redactionSummary ?? {
    flags: [],
    replacements: {},
    hiddenSections: [],
  };
  const totalRedactions = Object.values(redactionSummary.replacements).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );

  return (
    <div className="grid gap-6">
      <PageHero
        tone="dark"
        eyebrow={locale === "zh" ? "访客提交流程" : "Guest submission flow"}
        title={copy.title}
        description={copy.body}
        aside={
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <InsetCard tone="white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "步骤 1" : "Step 1"}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-700">
                {copy.stepOne}
              </div>
            </InsetCard>
            <InsetCard tone="tint">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "步骤 2" : "Step 2"}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-700">
                {copy.stepTwo}
              </div>
            </InsetCard>
            <InsetCard tone="white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "步骤 3" : "Step 3"}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-700">
                {copy.stepThree}
              </div>
            </InsetCard>
          </div>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] xl:items-start">
        <div className="grid gap-6">
          <SurfaceCard className="grid gap-5">
            <SectionHeading title={copy.uploadPanel} description={copy.uploadPanelBody} />
            <form onSubmit={handleUpload} className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-slate-700">{copy.chooseFile}</span>
                <input
                  type="file"
                  accept=".zip,application/zip"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className={fieldClass("input")}
                />
              </label>
              <div className="flex flex-wrap items-end gap-3">
                <button type="submit" disabled={uploading} className={actionButtonClass("primary")}>
                  {uploading ? copy.uploading : copy.upload}
                </button>
                {previewState ? (
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
          </SurfaceCard>

          {previewState ? (
            <SurfaceCard className="grid gap-6">
              <SectionHeading title={copy.preview} description={copy.previewBody} />

              <div className="grid gap-4">
                <InsetCard className="p-5">
                  <h3 className="text-lg font-semibold">{copy.bundleSummary}</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <InsetCard tone="white" className="text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.status}</div>
                      <div className="mt-2 font-medium text-slate-800">
                        {formatSubmissionStatusLabel(locale, previewState.status)}
                      </div>
                    </InsetCard>
                    <InsetCard tone="white" className="text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.generated}</div>
                      <div className="mt-2 font-medium text-slate-800">
                        {formatDate(locale, previewState.preview.bundle.generatedAt)}
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
                </InsetCard>

                <ReceiptPanel
                  locale={locale}
                  title={copy.previewReceiptTitle}
                  description={`${copy.previewReceiptBody} ${copy.copyHint}`}
                  filenamePrefix="skillatlas-preview-receipt"
                  fields={[
                    { label: copy.submissionId, value: previewState.submissionId },
                    { label: copy.previewToken, value: previewState.previewToken },
                  ]}
                />

                <InsetCard className="p-5">
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
                          ? `系统一共隐藏了 ${totalRedactions} 处敏感信息。`
                          : `The server hid ${totalRedactions} sensitive details automatically.`}
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

                {findings.map((finding) => (
                  <InsetCard key={finding.findingKey} className="p-5">
                    {(() => {
                      const target = parseSkillPresentation(finding.reportSkillId);

                      return (
                        <>
                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                      <span className="border border-slate-300 bg-white px-3 py-1">{copy.skill} {target.targetLabel}</span>
                      {finding.model ? <span className="border border-slate-300 bg-white px-3 py-1">{finding.model}</span> : null}
                      {finding.provider ? <span className="border border-slate-300 bg-white px-3 py-1">{finding.provider}</span> : null}
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">{finding.harmType}</h3>
                    <p className="mt-2 text-sm text-slate-500">{finding.vulnerabilitySurface}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <InsetCard tone="white" className="text-sm">
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.verdict}</div>
                        <div className="mt-2 text-slate-800">
                          {formatVerdictLabel(locale, finding.verdict)}
                        </div>
                      </InsetCard>
                      <InsetCard tone="white" className="text-sm">
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.confidence}</div>
                        <div className="mt-2 text-slate-800">{finding.confidence ?? "-"}</div>
                      </InsetCard>
                      <InsetCard tone="white" className="text-sm md:col-span-2">
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.evidence}</div>
                        <div className="mt-2 text-slate-800">{finding.evidenceSummaryPreview || "-"}</div>
                      </InsetCard>
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      <InsetCard tone="white" className="text-sm">
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.harmfulPrompt}</div>
                        <p className="mt-2 leading-7 text-slate-700">{finding.harmfulPromptPreview}</p>
                      </InsetCard>
                      <InsetCard tone="white" className="text-sm">
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.smokingGun}</div>
                        <p className="mt-2 leading-7 text-slate-700">{finding.smokingGunPreview || "-"}</p>
                      </InsetCard>
                      <InsetCard tone="white" className="text-sm">
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.finalResponse}</div>
                        <p className="mt-2 leading-7 text-slate-700">{finding.finalResponsePreview || "-"}</p>
                      </InsetCard>
                    </div>
                        </>
                      );
                    })()}
                  </InsetCard>
                ))}
              </div>
            </SurfaceCard>
          ) : null}
        </div>

        <div className="grid gap-4 xl:sticky xl:top-24">
          {!previewState ? (
            <>
              <SurfaceCard className="grid gap-4">
                <SectionHeading title={copy.privacyPanel} description={copy.privacyBody} />
                <InsetCard tone="white" className="text-sm leading-7 text-slate-700">
                  {copy.previewBody}
                </InsetCard>
                <Link href="/reports" className={actionButtonClass("secondary")}>
                  {copy.browseTracker}
                </Link>
              </SurfaceCard>

              <SurfaceCard className="grid gap-4">
                <SectionHeading title={copy.reviewPanel} description={copy.reviewBody} />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <InsetCard tone="white" className="text-sm">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.reportCount}</div>
                    <div className="mt-2 text-slate-800">{"zip -> preview -> admin"}</div>
                  </InsetCard>
                  <InsetCard tone="tint" className="text-sm leading-7 text-slate-700">
                    {copy.previewBody}
                  </InsetCard>
                </div>
              </SurfaceCard>
            </>
          ) : submittedState ? (
            <SurfaceCard className="grid gap-4">
              <SectionHeading title={copy.tracking} description={copy.trackingBody} />
              <ReceiptPanel
                locale={locale}
                title={copy.trackingReceiptTitle}
                description={`${copy.trackingReceiptBody} ${copy.copyHint}`}
                filenamePrefix="skillatlas-tracking-receipt"
                fields={[
                  { label: copy.submissionId, value: submittedState.submissionId },
                  { label: copy.trackingToken, value: submittedState.trackingToken },
                ]}
              />
              <Link
                href={`/reports?id=${encodeURIComponent(submittedState.submissionId)}&token=${encodeURIComponent(submittedState.trackingToken)}`}
                className={actionButtonClass("success")}
              >
                {copy.openTracker}
              </Link>
            </SurfaceCard>
          ) : (
            <SurfaceCard className="grid gap-4">
              <SectionHeading title={copy.submitPanel} description={copy.submitPanelBody} />
              <div className="grid gap-3">
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
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-slate-700">{copy.notes}</span>
                  <textarea
                    value={submissionNotes}
                    onChange={(event) => setSubmissionNotes(event.target.value)}
                    className={fieldClass("textarea")}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleFormalSubmit}
                  disabled={submitting}
                  className={actionButtonClass("primary")}
                >
                  {submitting ? copy.submitting : copy.confirm}
                </button>
              </div>
            </SurfaceCard>
          )}

          {submittedState ? (
            <div className="border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950">
              <h3 className="text-lg font-semibold">{copy.tracking}</h3>
              <p className="mt-2 leading-7">{copy.trackingBody}</p>
              <div className="mt-4 border border-emerald-200 bg-white px-4 py-3 text-slate-700">{copy.copyHint}</div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
