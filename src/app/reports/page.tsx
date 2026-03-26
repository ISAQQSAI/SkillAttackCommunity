import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { getViewer } from "@/lib/server/auth";
import { listViewerFindings } from "@/lib/server/store";

export default async function ReportsPage() {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <div className="rounded-[2rem] border border-dashed border-black/15 bg-white/80 p-10 text-sm text-slate-600">
        Sign in to see your submitted and drafted reports.
      </div>
    );
  }

  const reports = await listViewerFindings(viewer);

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-semibold tracking-tight">My reports</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Track draft progress, reviewer feedback, and publication state for the vulnerability reports tied to your account.
        </p>
      </section>

      <section className="grid gap-4">
        {reports.map((item) => (
          <Link
            key={item.finding.id}
            href={`/reports/${item.finding.id}`}
            className="grid gap-3 rounded-[1.6rem] border border-black/10 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={item.finding.status} />
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-600">
                  {item.finding.datasetTag}
                </span>
              </div>
              <span className="text-sm text-slate-500">{item.bundle?.detectedFiles.length || 0} artifacts</span>
            </div>
            <h2 className="text-xl font-semibold">{item.finding.title}</h2>
            <p className="text-sm leading-7 text-slate-600">{item.finding.summary}</p>
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
              <span className="rounded-full bg-slate-50 px-3 py-1">{item.finding.skillName}</span>
              <span className="rounded-full bg-slate-50 px-3 py-1">{item.finding.vulnType}</span>
              {item.published ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">public case live</span>
              ) : null}
            </div>
          </Link>
        ))}

        {!reports.length ? (
          <div className="rounded-[1.6rem] border border-dashed border-black/15 bg-white/70 p-10 text-sm text-slate-600">
            You have not created a finding report yet.
          </div>
        ) : null}
      </section>
    </div>
  );
}
