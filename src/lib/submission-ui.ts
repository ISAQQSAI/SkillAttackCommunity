import type { Locale } from "@/lib/i18n";

export const SUBMISSION_STATUSES = [
  "uploaded",
  "parsing",
  "preview_ready",
  "parse_failed",
  "submitted",
  "under_review",
  "rejected",
  "approved",
  "published",
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

const STATUS_LABELS: Record<SubmissionStatus, { en: string; zh: string }> = {
  uploaded: { en: "uploaded", zh: "已上传" },
  parsing: { en: "parsing", zh: "解析中" },
  preview_ready: { en: "preview ready", zh: "预览可用" },
  parse_failed: { en: "parse failed", zh: "解析失败" },
  submitted: { en: "submitted", zh: "已提交" },
  under_review: { en: "under review", zh: "审核中" },
  rejected: { en: "rejected", zh: "已拒绝" },
  approved: { en: "approved", zh: "已通过审核" },
  published: { en: "published", zh: "已发布" },
};

export const SUBMISSION_STATUS_TONES: Record<SubmissionStatus, string> = {
  uploaded: "bg-slate-100 text-slate-700",
  parsing: "bg-sky-100 text-sky-800",
  preview_ready: "bg-cyan-100 text-cyan-800",
  parse_failed: "bg-rose-100 text-rose-700",
  submitted: "bg-amber-100 text-amber-800",
  under_review: "bg-teal-100 text-teal-800",
  rejected: "bg-red-100 text-red-700",
  approved: "bg-emerald-100 text-emerald-800",
  published: "bg-lime-100 text-lime-800",
};

export function translateSubmissionStatus(status: SubmissionStatus, locale: Locale) {
  return STATUS_LABELS[status]?.[locale] || status;
}
