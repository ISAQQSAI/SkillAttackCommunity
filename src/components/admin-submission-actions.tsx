"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { actionButtonClass, SurfaceCard } from "@/components/page-chrome";
import type { Locale } from "@/lib/i18n";

interface AdminSubmissionActionsProps {
  submissionId: string;
  locale: Locale;
  currentStatus: string;
}

export function AdminSubmissionActions({
  submissionId,
  locale,
  currentStatus,
}: AdminSubmissionActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState("");

  const copy =
    locale === "zh"
      ? {
          working: "处理中...",
          reject: "拒绝",
          publish: "审核通过并公开",
          failed: "操作失败。",
        }
      : {
          working: "Working...",
          reject: "Reject",
          publish: "Approve and publish",
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

  async function review(action: "rejected" | "published") {
    setWorking(action);
    setMessage("");

    try {
      await postJson(`/api/admin/reports/${submissionId}/review`, {
        action,
      });
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

      <div className="flex flex-wrap justify-center gap-3">
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
          onClick={() => review("published")}
          disabled={Boolean(working)}
          className={actionButtonClass("success")}
        >
          {working === "published" ? copy.working : copy.publish}
        </button>
      </div>

      {message ? (
        <div className="rounded-[1.2rem] border border-black/10 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}
    </SurfaceCard>
  );
}
