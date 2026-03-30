import type { Locale } from "@/lib/i18n";
import {
  SUBMISSION_STATUS_TONES,
  translateSubmissionStatus,
  type SubmissionStatus,
} from "@/lib/submission-ui";

export function SubmissionStatusBadge({
  status,
  locale,
}: {
  status: SubmissionStatus;
  locale: Locale;
}) {
  return (
    <span
      className={`inline-flex rounded-full border border-white/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] shadow-[0_8px_20px_rgba(15,23,42,0.06)] ${SUBMISSION_STATUS_TONES[status]}`}
    >
      {translateSubmissionStatus(status, locale)}
    </span>
  );
}
