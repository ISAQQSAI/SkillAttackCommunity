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
      className={`inline-flex border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] ${SUBMISSION_STATUS_TONES[status]}`}
    >
      {translateSubmissionStatus(status, locale)}
    </span>
  );
}
