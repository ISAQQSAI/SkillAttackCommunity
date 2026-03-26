import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { getViewer } from "@/lib/server/auth";
import { listReviewFindings } from "@/lib/server/store";

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await getViewer();
  if (!viewer || (viewer.role !== "reviewer" && viewer.role !== "admin")) {
    return (
      <div className="rounded-[2rem] border border-dashed border-black/15 bg-white/80 p-10 text-sm text-slate-600">
        Reviewer or admin access is required to open the triage queue.
      </div>
    );
  }

  const params = await searchParams;
  const findings = await listReviewFindings({
    status: firstParam(params.status),
    vendor: firstParam(params.vendor),
    vuln: firstParam(params.vuln),
    dataset: firstParam(params.dataset),
  });

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-semibold tracking-tight">Reviewer queue</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Triage report submissions, inspect parsed artifacts, manage redaction flags, and publish reviewer-verified cases.
        </p>
        <form className="mt-6 grid gap-4 md:grid-cols-5">
          <input name="status" defaultValue={firstParam(params.status)} placeholder="status" className="rounded-2xl border border-black/10 px-4 py-3 text-sm" />
          <input name="vendor" defaultValue={firstParam(params.vendor)} placeholder="vendor" className="rounded-2xl border border-black/10 px-4 py-3 text-sm" />
          <input name="vuln" defaultValue={firstParam(params.vuln)} placeholder="vuln type" className="rounded-2xl border border-black/10 px-4 py-3 text-sm" />
          <input name="dataset" defaultValue={firstParam(params.dataset)} placeholder="dataset" className="rounded-2xl border border-black/10 px-4 py-3 text-sm" />
          <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white">Filter queue</button>
        </form>
      </section>

      <section className="grid gap-4">
        {findings.map((item) => (
          <Link
            key={item.finding.id}
            href={`/review/${item.finding.id}`}
            className="grid gap-3 rounded-[1.6rem] border border-black/10 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={item.finding.status} />
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.finding.datasetTag}</span>
              </div>
              <span className="text-sm text-slate-500">
                {item.bundle?.detectedFiles.length || 0} detected files
              </span>
            </div>
            <h2 className="text-xl font-semibold">{item.finding.title}</h2>
            <p className="text-sm leading-7 text-slate-600">{item.finding.summary}</p>
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
              <span className="rounded-full bg-slate-50 px-3 py-1">{item.finding.vendor}</span>
              <span className="rounded-full bg-slate-50 px-3 py-1">{item.finding.vulnType}</span>
              <span className="rounded-full bg-slate-50 px-3 py-1">duplicates: {item.duplicateCandidates.length}</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
