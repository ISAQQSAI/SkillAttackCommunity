"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  actionButtonClass,
  fieldClass,
  InsetCard,
  SurfaceCard,
} from "@/components/page-chrome";
import type { Locale } from "@/lib/i18n";

interface AdminSubmissionActionsProps {
  submissionId: string;
  locale: Locale;
  currentStatus: string;
  currentTitle?: string;
  currentSummary?: string;
  currentSlug?: string;
  currentVerificationSummary?: string | null;
  hasPublicCase: boolean;
}

export function AdminSubmissionActions({
  submissionId,
  locale,
  currentStatus,
  currentTitle,
  currentSummary,
  currentSlug,
  currentVerificationSummary,
  hasPublicCase,
}: AdminSubmissionActionsProps) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [verificationSummary, setVerificationSummary] = useState(currentVerificationSummary || "");
  const [title, setTitle] = useState(currentTitle || "");
  const [summary, setSummary] = useState(currentSummary || "");
  const [slug, setSlug] = useState(currentSlug || "");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState("");

  const copy =
    locale === "zh"
      ? {
          adminNotes: "管理员备注",
          verificationSummary: "审核结论",
          needsVerification: "通过审核前需要填写审核结论。",
          working: "处理中...",
          markReviewing: "标记为审核中",
          reject: "拒绝",
          approve: "通过审核",
          publish: "发布公开案例",
          unpublish: "下架公开案例",
          publishTitle: "公开标题",
          publishSummary: "公开摘要",
          slug: "公开 slug",
          failed: "操作失败。",
        }
      : {
          adminNotes: "Admin notes",
          verificationSummary: "Verification summary",
          needsVerification: "A verification summary is required before approval.",
          working: "Working...",
          markReviewing: "Mark under review",
          reject: "Reject",
          approve: "Approve",
          publish: "Publish public case",
          unpublish: "Unpublish public case",
          publishTitle: "Public title",
          publishSummary: "Public summary",
          slug: "Public slug",
          failed: "Request failed.",
        };

  async function postJson(url: string, body: Record<string, unknown>) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error || copy.failed);
    }
    return json;
  }

  async function review(action: "under_review" | "rejected" | "approved") {
    if (action === "approved" && !verificationSummary.trim()) {
      setMessage(copy.needsVerification);
      return;
    }

    setWorking(action);
    setMessage("");

    try {
      await postJson(`/api/admin/reports/${submissionId}/review`, {
        action,
        notes,
        verificationSummary,
      });
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.failed);
    } finally {
      setWorking("");
    }
  }

  async function publish() {
    setWorking("publish");
    setMessage("");

    try {
      await postJson(`/api/admin/reports/${submissionId}/publish`, {
        title,
        summary,
        slug,
      });
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.failed);
    } finally {
      setWorking("");
    }
  }

  async function unpublish() {
    setWorking("unpublish");
    setMessage("");

    try {
      await postJson(`/api/admin/reports/${submissionId}/unpublish`, {});
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.failed);
    } finally {
      setWorking("");
    }
  }

  return (
    <SurfaceCard className="grid gap-4">
      <div className="text-sm text-slate-500">
        {locale === "zh" ? "当前状态" : "Current status"}: <strong className="text-slate-900">{currentStatus}</strong>
      </div>

      <label className="grid gap-2 text-sm">
        <span className="font-medium text-slate-700">{copy.adminNotes}</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className={fieldClass("textarea")}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="font-medium text-slate-700">{copy.verificationSummary}</span>
        <textarea
          value={verificationSummary}
          onChange={(event) => setVerificationSummary(event.target.value)}
          className={fieldClass("textarea")}
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => review("under_review")}
          disabled={Boolean(working)}
          className={actionButtonClass("secondary")}
        >
          {working === "under_review" ? copy.working : copy.markReviewing}
        </button>
        <button
          type="button"
          onClick={() => review("rejected")}
          disabled={Boolean(working)}
          className={actionButtonClass("danger")}
        >
          {working === "rejected" ? copy.working : copy.reject}
        </button>
        <button
          type="button"
          onClick={() => review("approved")}
          disabled={Boolean(working)}
          className={actionButtonClass("success")}
        >
          {working === "approved" ? copy.working : copy.approve}
        </button>
      </div>

      <InsetCard className="grid gap-3">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-700">{copy.publishTitle}</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={fieldClass("input")}
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-700">{copy.publishSummary}</span>
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            className={fieldClass("textarea")}
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-700">{copy.slug}</span>
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className={fieldClass("input")}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={publish}
            disabled={Boolean(working)}
            className={actionButtonClass("primary")}
          >
            {working === "publish" ? copy.working : copy.publish}
          </button>
          {hasPublicCase ? (
            <button
              type="button"
              onClick={unpublish}
              disabled={Boolean(working)}
              className={actionButtonClass("secondary")}
            >
              {working === "unpublish" ? copy.working : copy.unpublish}
            </button>
          ) : null}
        </div>
      </InsetCard>

      {message ? (
        <div className="rounded-[1.2rem] border border-black/10 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}
    </SurfaceCard>
  );
}
