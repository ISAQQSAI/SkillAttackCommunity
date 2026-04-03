"use client";

import Link from "next/link";
import { useState } from "react";

import { SurfaceCard } from "@/components/page-chrome";
import type { Locale } from "@/lib/i18n";

function squareButtonClass(tone: "primary" | "secondary" = "primary") {
  if (tone === "secondary") {
    return "inline-flex items-center justify-center border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-400 hover:bg-[#f3f7fd] disabled:cursor-not-allowed disabled:opacity-60";
  }

  return "inline-flex items-center justify-center border border-[#11284e] bg-[#11284e] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#0d1f3b] disabled:cursor-not-allowed disabled:opacity-60";
}

function squareFieldClass() {
  return "w-full border border-slate-300 bg-[#fbfdff] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#244980] focus:bg-white file:mr-4 file:border-0 file:bg-[#11284e] file:px-4 file:py-3 file:text-sm file:font-medium file:text-white hover:file:bg-[#0d1f3b]";
}

export function HomeActionRail({
  locale,
}: {
  locale: Locale;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const copy =
    locale === "zh"
      ? {
          uploadEyebrow: "上传入口",
          uploadTitle: "上传漏洞报告",
          uploadBody:
            "上传 zip 压缩包后，系统会先生成一份公开预览。你确认展示内容没有问题后，才会正式提交审核。",
          chooseFile: "选择 zip 文件",
          upload: "上传并查看预览",
          uploading: "解析中...",
          uploadHint: "原始 zip、原始 JSON 和完整轨迹不会直接公开；公开页面只会使用审核后的安全摘要。",
          openFullUpload: "进入完整上传页",
          stepOne: "1 上传 zip 文件",
          stepTwo: "2 检查可公开预览",
          stepThree: "3 提交并保存查询回执",
          trackerEyebrow: "状态查询",
          trackerTitle: "查询我的提交",
          trackerBody:
            "输入提交编号和查询回执，查看当前进度、平台反馈，以及是否已经发布为公开页面。",
          submissionId: "提交编号",
          trackingToken: "查询回执",
          track: "查看进度",
          openTracker: "进入查询页",
          trackerHint: "正式提交后，这两个值就是你的查询凭证。",
          chooseFirst: "请先选择 zip 文件。",
        }
      : {
          uploadEyebrow: "Upload entry",
          uploadTitle: "Submit a vulnerability report",
          uploadBody:
            "Upload your zip bundle and the server will build a public preview first. You review that preview before anything is formally submitted for review.",
          chooseFile: "Choose zip file",
          upload: "Upload and preview",
          uploading: "Parsing bundle...",
          uploadHint: "Raw bundles, raw JSON, and full trajectories are never published directly. Public pages use reviewed summaries only.",
          openFullUpload: "Open full upload page",
          stepOne: "1 Upload the zip",
          stepTwo: "2 Review the public preview",
          stepThree: "3 Submit and save your receipt",
          trackerEyebrow: "Status lookup",
          trackerTitle: "Track my submission",
          trackerBody:
            "Enter your submission number and tracking receipt to see progress, platform feedback, and whether the report has been published.",
          submissionId: "Submission number",
          trackingToken: "Tracking receipt",
          track: "Check status",
          openTracker: "Open tracking page",
          trackerHint: "These two values become your lookup receipt after formal submission.",
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
      <SurfaceCard className="grid gap-5 rounded-none border-slate-200 hover:shadow-none">
        <div className="grid gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            {copy.uploadEyebrow}
          </div>
          <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-slate-950">
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
              className={squareFieldClass()}
            />
          </label>
          <button type="submit" disabled={uploading} className={squareButtonClass("primary")}>
            {uploading ? copy.uploading : copy.upload}
          </button>
        </form>

        <div className="grid gap-3 border border-slate-200 bg-[linear-gradient(180deg,#fbfdff,#f2f7fc)] p-4 text-sm">
          <p className="leading-7 text-slate-700">{copy.uploadHint}</p>
          <div className="grid gap-2">
            <div className="border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{copy.stepOne}</div>
            <div className="border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{copy.stepTwo}</div>
            <div className="border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{copy.stepThree}</div>
          </div>
        </div>

        {error ? (
          <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        ) : null}

        <Link href="/submit" className={squareButtonClass("secondary")}>
          {copy.openFullUpload}
        </Link>
      </SurfaceCard>

      <SurfaceCard className="grid gap-5 rounded-none border-slate-200 hover:shadow-none">
        <div className="grid gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            {copy.trackerEyebrow}
          </div>
          <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-slate-950">
            {copy.trackerTitle}
          </h2>
          <p className="text-sm leading-7 text-slate-600">{copy.trackerBody}</p>
        </div>

        <form action="/reports" className="grid gap-3">
          <input
            name="id"
            placeholder={copy.submissionId}
            className={squareFieldClass()}
          />
          <input
            name="token"
            placeholder={copy.trackingToken}
            className={squareFieldClass()}
          />
          <button type="submit" className={squareButtonClass("primary")}>
            {copy.track}
          </button>
        </form>

        <div className="border border-slate-200 bg-[linear-gradient(180deg,#fbfdff,#f2f7fc)] px-4 py-3 text-sm leading-7 text-slate-700">
          {copy.trackerHint}
        </div>

        <Link href="/reports" className={squareButtonClass("secondary")}>
          {copy.openTracker}
        </Link>
      </SurfaceCard>
    </div>
  );
}
