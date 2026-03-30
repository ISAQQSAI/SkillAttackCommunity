"use client";

import Link from "next/link";
import { useState } from "react";

import {
  actionButtonClass,
  fieldClass,
  InsetCard,
  SurfaceCard,
} from "@/components/page-chrome";
import type { Locale } from "@/lib/i18n";

export function HomeActionRail({
  locale,
  previewReadyCount,
  pendingReviewCount,
  isAdmin,
}: {
  locale: Locale;
  previewReadyCount: number;
  pendingReviewCount: number;
  isAdmin: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const copy =
    locale === "zh"
      ? {
          uploadEyebrow: "上传入口",
          uploadTitle: "上传 bundle",
          uploadBody:
            "首页直接上传 `report_bundle.zip`。系统会先生成脱敏预览，再跳转到完整确认页完成正式提交。",
          chooseFile: "选择 zip 文件",
          upload: "上传并生成预览",
          uploading: "解析中...",
          uploadHint: "仅支持标准化 report bundle，预览生成后不会直接公开。",
          openFullUpload: "打开完整上传页",
          trackerEyebrow: "状态查询",
          trackerTitle: "查询提交状态",
          trackerBody:
            "输入 submission ID 和 tracking token，查看审核进度、管理员结论，以及是否已经发布为公开案例。",
          submissionId: "Submission ID",
          trackingToken: "Tracking Token",
          track: "查询状态",
          openTracker: "打开状态查询页",
          previewReady: "预览待确认",
          pendingReview: "待管理员处理",
          adminQueue: "打开审核后台",
          chooseFirst: "请先选择 zip 文件。",
        }
      : {
          uploadEyebrow: "Upload entry",
          uploadTitle: "Upload bundle",
          uploadBody:
            "Start from the home page by uploading `report_bundle.zip`. The server generates a sanitized preview first, then sends you to the full confirmation page for formal submission.",
          chooseFile: "Choose zip file",
          upload: "Upload and build preview",
          uploading: "Parsing bundle...",
          uploadHint: "Only standardized report bundles are supported, and nothing is published directly from this step.",
          openFullUpload: "Open full upload page",
          trackerEyebrow: "Status lookup",
          trackerTitle: "Track submission",
          trackerBody:
            "Enter your submission ID and tracking token to check review progress, admin conclusions, and publication state.",
          submissionId: "Submission ID",
          trackingToken: "Tracking token",
          track: "Track status",
          openTracker: "Open tracking page",
          previewReady: "Preview ready",
          pendingReview: "Pending admin review",
          adminQueue: "Open admin queue",
          chooseFirst: "Choose a zip file first.",
        };

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError(copy.chooseFirst);
      return;
    }

    setUploading(true);
    setError("");

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

      window.location.assign(
        `/submit?id=${encodeURIComponent(json.submissionId)}&previewToken=${encodeURIComponent(json.previewToken)}`
      );
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-4 xl:sticky xl:top-24">
      <SurfaceCard className="grid gap-5">
        <div className="grid gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            {copy.uploadEyebrow}
          </div>
          <h2 className="text-[1.65rem] font-semibold tracking-[-0.05em] text-slate-950">
            {copy.uploadTitle}
          </h2>
          <p className="text-sm leading-7 text-slate-600">{copy.uploadBody}</p>
        </div>

        <form onSubmit={handleUpload} className="grid gap-4">
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-700">{copy.chooseFile}</span>
            <input
              type="file"
              accept=".zip,application/zip"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className={fieldClass("input")}
            />
          </label>
          <button type="submit" disabled={uploading} className={actionButtonClass("primary")}>
            {uploading ? copy.uploading : copy.upload}
          </button>
        </form>

        <InsetCard className="grid gap-3 text-sm">
          <p className="leading-7 text-slate-700">{copy.uploadHint}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.2rem] bg-white px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {copy.previewReady}
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                {previewReadyCount}
              </div>
            </div>
            <div className="rounded-[1.2rem] bg-white px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {copy.pendingReview}
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                {pendingReviewCount}
              </div>
            </div>
          </div>
        </InsetCard>

        {error ? (
          <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        ) : null}

        <Link href="/submit" className={actionButtonClass("secondary")}>
          {copy.openFullUpload}
        </Link>
      </SurfaceCard>

      <SurfaceCard className="grid gap-5">
        <div className="grid gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            {copy.trackerEyebrow}
          </div>
          <h2 className="text-[1.65rem] font-semibold tracking-[-0.05em] text-slate-950">
            {copy.trackerTitle}
          </h2>
          <p className="text-sm leading-7 text-slate-600">{copy.trackerBody}</p>
        </div>

        <form action="/reports" className="grid gap-3">
          <input
            name="id"
            placeholder={copy.submissionId}
            className={fieldClass("input")}
          />
          <input
            name="token"
            placeholder={copy.trackingToken}
            className={fieldClass("input")}
          />
          <button type="submit" className={actionButtonClass("primary")}>
            {copy.track}
          </button>
        </form>

        <div className="flex flex-wrap gap-3">
          <Link href="/reports" className={actionButtonClass("secondary")}>
            {copy.openTracker}
          </Link>
          {isAdmin ? (
            <Link href="/review" className={actionButtonClass("ghost")}>
              {copy.adminQueue}
            </Link>
          ) : null}
        </div>
      </SurfaceCard>
    </div>
  );
}
