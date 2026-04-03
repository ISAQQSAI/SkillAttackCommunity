import type { Locale } from "@/lib/i18n";

export const SUBMISSION_STATUSES = [
  "submitted",
  "under_review",
  "rejected",
  "published",
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

const STATUS_LABELS: Record<SubmissionStatus, { en: string; zh: string }> = {
  submitted: { en: "submitted", zh: "已提交" },
  under_review: { en: "under review", zh: "审核中" },
  rejected: { en: "rejected", zh: "已拒绝" },
  published: { en: "published", zh: "已发布" },
};

export const SUBMISSION_STATUS_TONES: Record<SubmissionStatus, string> = {
  submitted: "bg-amber-100 text-amber-800",
  under_review: "bg-teal-100 text-teal-800",
  rejected: "bg-red-100 text-red-700",
  published: "bg-lime-100 text-lime-800",
};

export function translateSubmissionStatus(status: SubmissionStatus, locale: Locale) {
  return STATUS_LABELS[status]?.[locale] || status;
}
