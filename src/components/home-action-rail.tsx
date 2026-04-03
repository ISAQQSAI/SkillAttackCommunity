"use client";

import Link from "next/link";
import { useState } from "react";

import { SurfaceCard } from "@/components/page-chrome";
import type { Locale } from "@/lib/i18n";
import { LAST_SUBMISSION_STORAGE_KEY } from "@/lib/submission-receipt";

function squareButtonClass(tone: "primary" | "secondary" = "primary") {
  if (tone === "secondary") {
    return "inline-flex items-center justify-center border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-400 hover:bg-[#f3f7fd] disabled:cursor-not-allowed disabled:opacity-60";
  }

  return "inline-flex items-center justify-center border border-[#11284e] bg-[#11284e] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#0d1f3b] disabled:cursor-not-allowed disabled:opacity-60";
}

function squareFieldClass() {
  return "w-full border border-slate-300 bg-[#fbfdff] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#244980] focus:bg-white file:mr-4 file:border-0 file:bg-[#11284e] file:px-4 file:py-3 file:text-sm file:font-medium file:text-white hover:file:bg-[#0d1f3b]";
}

function skillAttackLinkClass() {
  return "group relative inline-flex items-center font-bold text-[#1d4f91] transition duration-200 ease-out hover:-translate-y-0.5 hover:text-[#11284e] focus-visible:-translate-y-0.5 focus-visible:text-[#11284e] focus-visible:outline-none";
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
          uploadTitle: "提交攻击轨迹",
          uploadBody:
            "支持两种提交方式：通过命令行脚本自动上传，或在本页手动上传 zip 文件。",
          chooseFile: "选择 zip 文件",
          upload: "提交",
          uploading: "提交中...",
          uploadHint:
            '两种方式提交后都会获得一个提交编号，可在"查询提交"页面追踪处理状态。',
          methodOneTitle: "方式 1 · 命令行上传",
          methodOneLead: "运行 SkillAttack 实验后，使用上传脚本将结果直接推送到平台：",
          methodOneCommand: "python scripts/upload_results.py <结果目录>",
          methodTwoTitle: "方式 2 · 网页上传",
          methodTwoBody: "在上方选择 zip 文件并点击提交。",
          trackerEyebrow: "状态查询",
          trackerTitle: "查询我的提交",
          trackerBody:
            "输入提交编号，查看当前进度、平台反馈，以及是否已经发布为公开页面。",
          submissionId: "提交编号",
          track: "查看进度",
          openTracker: "进入查询页",
          trackerHint: "上传成功后，提交编号会立即返回给你，后续查询只需要它。",
          chooseFirst: "请先选择 zip 文件。",
        }
      : {
          uploadEyebrow: "Upload entry",
          uploadTitle: "Submit an attack trace",
          uploadBody:
            "Two submission paths are supported: upload automatically from the command line, or upload a zip file manually on this page.",
          chooseFile: "Choose zip file",
          upload: "Submit",
          uploading: "Submitting...",
          uploadHint:
            'Both submission paths return a submission number that you can track from the "Track Submission" page.',
          methodOneTitle: "Option 1 · Command-line upload",
          methodOneLead:
            "After running SkillAttack, use the upload script to push results directly to the platform:",
          methodOneCommand: "python scripts/upload_results.py <results_dir>",
          methodTwoTitle: "Option 2 · Web upload",
          methodTwoBody: "Choose a zip file above and click submit.",
          trackerEyebrow: "Status lookup",
          trackerTitle: "Track my submission",
          trackerBody:
            "Enter your submission number to see progress, platform feedback, and whether the report has been published.",
          submissionId: "Submission number",
          track: "Check status",
          openTracker: "Open tracking page",
          trackerHint: "Your submission number is returned immediately after upload.",
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

      window.sessionStorage.setItem(
        LAST_SUBMISSION_STORAGE_KEY,
        JSON.stringify({
          submissionId: json.submissionId,
        })
      );

      window.location.assign(
        `/submit?id=${encodeURIComponent(json.submissionId)}`
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
          <div className="grid gap-2">
            <div className="border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {copy.methodOneTitle}
              </div>
              <div className="mt-2 leading-7">
                {locale === "zh" ? (
                  <>
                    运行{" "}
                    <a
                      href="https://github.com/ISAQQSAI/SkillAttack"
                      target="_blank"
                      rel="noreferrer"
                      className={skillAttackLinkClass()}
                    >
                      <span className="relative z-10">SkillAttack</span>
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-[0.08em] h-[0.28em] origin-left scale-x-0 bg-[linear-gradient(90deg,rgba(59,130,246,0.18),rgba(29,78,216,0.34))] transition duration-300 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100"
                      />
                    </a>{" "}
                    实验后，使用上传脚本将结果直接推送到平台：
                  </>
                ) : (
                  <>
                    After running{" "}
                    <a
                      href="https://github.com/ISAQQSAI/SkillAttack"
                      target="_blank"
                      rel="noreferrer"
                      className={skillAttackLinkClass()}
                    >
                      <span className="relative z-10">SkillAttack</span>
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-[0.08em] h-[0.28em] origin-left scale-x-0 bg-[linear-gradient(90deg,rgba(59,130,246,0.18),rgba(29,78,216,0.34))] transition duration-300 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100"
                      />
                    </a>
                    , use the upload script to push results directly to the platform:
                  </>
                )}
              </div>
              <div className="mt-3 border border-slate-200 bg-[#f7fafe] px-4 py-3 font-mono text-[13px] text-slate-900">
                {copy.methodOneCommand}
              </div>
            </div>
            <div className="border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {copy.methodTwoTitle}
              </div>
              <div className="mt-2 leading-7">{copy.methodTwoBody}</div>
            </div>
          </div>
          <p className="leading-7 text-slate-700">{copy.uploadHint}</p>
        </div>

        {error ? (
          <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        ) : null}
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
