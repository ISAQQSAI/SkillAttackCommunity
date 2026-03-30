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
import type { Locale } from "@/lib/i18n";
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
          title: "上传 report bundle",
          body:
            "直接上传 `report_bundle.zip`。系统会先解析并自动脱敏，再把可公开的预览给你确认；确认后才会正式提交给管理员审核。",
          chooseFile: "选择 zip 文件",
          upload: "上传并生成预览",
          uploading: "解析中...",
          replace: "重新上传其他 bundle",
          preview: "脱敏预览",
          previewBody:
            "下面展示的是正式提交前你能看到的安全版结构化结果。原始 JSON、轨迹、工具调用和 skill.zip 不会在社区公开。",
          bundleSummary: "Bundle 摘要",
          reportCount: "报告数",
          findingCount: "发现数",
          redaction: "脱敏摘要",
          hiddenSections: "默认隐藏的原始区域",
          replacements: "替换计数",
          submitterLabel: "显示名称（可选）",
          contactEmail: "联系邮箱（可选）",
          notes: "给管理员的备注（可选）",
          confirm: "确认并正式提交",
          submitting: "提交中...",
          tracking: "已正式提交",
          trackingBody:
            "请保存下面的 submission ID 和 tracking token。后续查询审核状态需要用到它们。",
          openTracker: "打开状态页",
          skill: "Skill",
          verdict: "判定",
          confidence: "置信度",
          evidence: "证据摘要",
          harmfulPrompt: "攻击输入摘要",
          smokingGun: "关键证据",
          finalResponse: "最终响应摘要",
          generated: "生成时间",
          status: "状态",
          previewToken: "Preview Token",
          submissionId: "Submission ID",
          trackingToken: "Tracking Token",
          uploadPanel: "上传入口",
          uploadPanelBody: "选择标准化 zip 后，系统会先生成脱敏预览，不会直接公开任何原始内容。",
          privacyPanel: "隐私与提交流程",
          privacyBody: "原始 bundle、原始 JSON、完整 trajectory、tool calls 和 skill archive 都只保留在内部审核流。",
          reviewPanel: "正式提交后",
          reviewBody: "你会得到 submission ID 和 tracking token，用它们在查询页追踪审核进度和公开状态。",
          submitPanel: "正式提交",
          submitPanelBody: "确认脱敏结果没有问题后，再填写可选信息并正式提交给管理员。",
          browseTracker: "打开查询页",
        }
      : {
          title: "Upload report bundle",
          body:
            "Upload a `report_bundle.zip` directly. The server parses and redacts it first, shows you the public-safe preview, and only then lets you formally submit it for admin review.",
          chooseFile: "Choose zip file",
          upload: "Upload and build preview",
          uploading: "Parsing bundle...",
          replace: "Upload another bundle",
          preview: "Sanitized preview",
          previewBody:
            "This is the public-safe structured preview you see before formal submission. Raw JSON, trajectories, tool calls, and skill archives stay out of the public community UI.",
          bundleSummary: "Bundle summary",
          reportCount: "Reports",
          findingCount: "Findings",
          redaction: "Redaction summary",
          hiddenSections: "Sections hidden by default",
          replacements: "Replacement counts",
          submitterLabel: "Display name (optional)",
          contactEmail: "Contact email (optional)",
          notes: "Note to admin (optional)",
          confirm: "Confirm and submit",
          submitting: "Submitting...",
          tracking: "Submission created",
          trackingBody:
            "Save the submission ID and tracking token below. You will need them to check review status later.",
          openTracker: "Open tracking page",
          skill: "Skill",
          verdict: "Verdict",
          confidence: "Confidence",
          evidence: "Evidence summary",
          harmfulPrompt: "Prompt summary",
          smokingGun: "Smoking gun",
          finalResponse: "Final response summary",
          generated: "Generated at",
          status: "Status",
          previewToken: "Preview token",
          submissionId: "Submission ID",
          trackingToken: "Tracking token",
          uploadPanel: "Upload entry",
          uploadPanelBody: "Choose a standardized zip and the server will build a sanitized preview before anything becomes visible to admin review.",
          privacyPanel: "Privacy boundary",
          privacyBody: "Raw bundles, raw JSON, full trajectories, tool calls, and skill archives remain inside the internal review flow.",
          reviewPanel: "After formal submission",
          reviewBody: "You will receive a submission ID and tracking token to track review progress and publication state later.",
          submitPanel: "Formal submission",
          submitPanelBody: "Confirm that the sanitized preview looks right, then fill in optional context and submit it to admin review.",
          browseTracker: "Open tracking page",
        };

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
      const url = new URL(window.location.href);
      url.pathname = "/reports";
      url.search = `id=${encodeURIComponent(json.submissionId)}&token=${encodeURIComponent(json.trackingToken)}`;
      window.history.replaceState({}, "", url.toString());
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

  return (
    <div className="grid gap-6">
      <PageHero
        tone="dark"
        eyebrow={locale === "zh" ? "Guest upload workflow" : "Guest upload workflow"}
        title={copy.title}
        description={copy.body}
        aside={
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <InsetCard tone="white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "步骤 1" : "Step 1"}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-700">
                {locale === "zh" ? "上传标准化 zip" : "Upload a standardized zip"}
              </div>
            </InsetCard>
            <InsetCard tone="tint">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "步骤 2" : "Step 2"}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-700">
                {locale === "zh" ? "确认脱敏预览" : "Confirm the sanitized preview"}
              </div>
            </InsetCard>
            <InsetCard tone="white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {locale === "zh" ? "步骤 3" : "Step 3"}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-700">
                {locale === "zh" ? "正式提交给管理员" : "Formally submit to admin"}
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
              <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
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
                      <div className="mt-2 font-medium text-slate-800">{previewState.status}</div>
                    </InsetCard>
                    <InsetCard tone="white" className="text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.generated}</div>
                      <div className="mt-2 font-medium text-slate-800">
                        {formatDate(locale, previewState.preview.bundle.generatedAt)}
                      </div>
                    </InsetCard>
                    <InsetCard tone="white" className="text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.reportCount}</div>
                      <div className="mt-2 font-medium text-slate-800">{reports.length}</div>
                    </InsetCard>
                    <InsetCard tone="white" className="text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.findingCount}</div>
                      <div className="mt-2 font-medium text-slate-800">{findings.length}</div>
                    </InsetCard>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InsetCard tone="white" className="text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.submissionId}</div>
                      <div className="mt-2 break-all font-medium text-slate-800">{previewState.submissionId}</div>
                    </InsetCard>
                    <InsetCard tone="white" className="text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.previewToken}</div>
                      <div className="mt-2 break-all font-medium text-slate-800">{previewState.previewToken}</div>
                    </InsetCard>
                  </div>
                </InsetCard>

                <InsetCard className="p-5">
                  <h3 className="text-lg font-semibold">{copy.redaction}</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <InsetCard tone="white" className="text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.hiddenSections}</div>
                      <div className="mt-2 grid gap-2">
                        {redactionSummary.hiddenSections.map((item) => (
                          <div key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                            {item}
                          </div>
                        ))}
                      </div>
                    </InsetCard>
                    <InsetCard tone="white" className="text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.replacements}</div>
                      <div className="mt-2 grid gap-2">
                        {Object.entries(redactionSummary.replacements).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
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
                        <span key={flag} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                          {flag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </InsetCard>

                {findings.map((finding) => (
                  <InsetCard key={finding.findingKey} className="p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                      <span className="rounded-full bg-white px-3 py-1">{copy.skill} {finding.reportSkillId}</span>
                      {finding.model ? <span className="rounded-full bg-white px-3 py-1">{finding.model}</span> : null}
                      {finding.provider ? <span className="rounded-full bg-white px-3 py-1">{finding.provider}</span> : null}
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">{finding.harmType}</h3>
                    <p className="mt-2 text-sm text-slate-500">{finding.vulnerabilitySurface}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <InsetCard tone="white" className="text-sm">
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.verdict}</div>
                        <div className="mt-2 text-slate-800">{finding.verdict || "-"}</div>
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
                  {copy.reviewBody}
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
            <div className="rounded-[1.6rem] border border-emerald-200 bg-[linear-gradient(180deg,_rgba(236,253,245,0.96),_rgba(209,250,229,0.9))] p-5 text-sm text-emerald-950 shadow-[0_18px_45px_rgba(5,150,105,0.12)]">
              <h3 className="text-lg font-semibold">{copy.tracking}</h3>
              <p className="mt-2 leading-7">{copy.trackingBody}</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <strong>{copy.submissionId}:</strong> {submittedState.submissionId}
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 break-all">
                  <strong>{copy.trackingToken}:</strong> {submittedState.trackingToken}
                </div>
                <Link
                  href={`/reports?id=${encodeURIComponent(submittedState.submissionId)}&token=${encodeURIComponent(submittedState.trackingToken)}`}
                  className={actionButtonClass("success")}
                >
                  {copy.openTracker}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
