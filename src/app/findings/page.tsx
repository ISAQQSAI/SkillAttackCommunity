import Link from "next/link";

import { listPublicFindingViews } from "@/lib/server/store";

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function FindingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = {
    q: firstParam(params.q),
    skill: firstParam(params.skill),
    skillUrl: firstParam(params.skillUrl),
    model: firstParam(params.model),
    dataset: firstParam(params.dataset),
    vuln: firstParam(params.vuln),
    verification: firstParam(params.verification),
  };
  const findings = await listPublicFindingViews(filters);

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-semibold tracking-tight">Published findings</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          Browse standardized public case pages built from reviewer-verified reports. Filters work on the published metadata only.
        </p>
        <form className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-8">
          <input name="q" defaultValue={filters.q} placeholder="search" className="rounded-2xl border border-black/10 px-4 py-3 text-sm" />
          <input name="skill" defaultValue={filters.skill} placeholder="skill" className="rounded-2xl border border-black/10 px-4 py-3 text-sm" />
          <input name="skillUrl" defaultValue={filters.skillUrl} placeholder="skill URL" className="rounded-2xl border border-black/10 px-4 py-3 text-sm" />
          <input name="model" defaultValue={filters.model} placeholder="model" className="rounded-2xl border border-black/10 px-4 py-3 text-sm" />
          <input name="dataset" defaultValue={filters.dataset} placeholder="dataset" className="rounded-2xl border border-black/10 px-4 py-3 text-sm" />
          <input name="vuln" defaultValue={filters.vuln} placeholder="vuln type" className="rounded-2xl border border-black/10 px-4 py-3 text-sm" />
          <input name="verification" defaultValue={filters.verification} placeholder="verification" className="rounded-2xl border border-black/10 px-4 py-3 text-sm" />
          <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white">Apply filters</button>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {findings.map((item) => (
          <Link
            key={item.published.id}
            href={`/findings/${item.published.slug}`}
            className="grid gap-3 rounded-[1.6rem] border border-black/10 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-600">{item.finding.datasetTag}</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-800">{item.published.verificationBadge}</span>
            </div>
            <h2 className="text-xl font-semibold">{item.published.publicTitle}</h2>
            <p className="text-sm leading-7 text-slate-600">{item.published.publicSummary}</p>
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
              <span className="rounded-full bg-slate-50 px-3 py-1">{item.finding.skillName}</span>
              <span className="rounded-full bg-slate-50 px-3 py-1">{item.finding.vendor}</span>
              <span className="rounded-full bg-slate-50 px-3 py-1">{item.finding.vulnType}</span>
            </div>
          </Link>
        ))}
        {!findings.length ? (
          <div className="rounded-[1.6rem] border border-dashed border-black/15 bg-white/70 p-10 text-sm text-slate-600">
            No published findings match the current filters.
          </div>
        ) : null}
      </section>
    </div>
  );
}
