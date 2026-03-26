import type { FindingStatus } from "@/lib/community";

const tone: Record<FindingStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-amber-100 text-amber-800",
  needs_info: "bg-orange-100 text-orange-800",
  triaged: "bg-cyan-100 text-cyan-800",
  duplicate: "bg-slate-200 text-slate-700",
  redaction_required: "bg-rose-100 text-rose-700",
  reviewer_verified: "bg-emerald-100 text-emerald-800",
  published: "bg-lime-100 text-lime-800",
  rejected: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: FindingStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${tone[status]}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
