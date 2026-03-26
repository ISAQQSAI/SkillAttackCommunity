import Link from "next/link";

import { getLocale } from "@/lib/server/locale";
import {
  getDatasetLabel,
  getSkillVaultCopy,
  getSkillVaultDatasetSections,
  getSkillVaultSummary,
  listSkillVaultRecords,
} from "@/lib/skill-vault";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatNumber(locale: string, value: number, suffix?: string) {
  const formatted = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

  return `${formatted}${suffix || ""}`;
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();
  const copy = getSkillVaultCopy(locale);
  const params = await searchParams;
  const filters = {
    q: firstParam(params.q),
    dataset: firstParam(params.dataset),
    vuln: firstParam(params.vuln),
    model: firstParam(params.model),
  };
  const summary = getSkillVaultSummary();
  const records = listSkillVaultRecords(filters);
  const sections = getSkillVaultDatasetSections(records);

  return (
    <div className="grid gap-8">
      <section className="overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(203,255,122,0.18),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(255,104,71,0.22),_transparent_24%),linear-gradient(135deg,_#0f172a,_#1e293b_55%,_#4f2b29)] p-8 text-white shadow-[0_32px_120px_rgba(15,23,42,0.28)]">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div className="grid gap-5">
            <div className="w-fit rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/75">
              {copy.heroBadge}
            </div>
            <h1 className="text-5xl font-semibold tracking-[-0.08em]">{copy.title}</h1>
            <p className="max-w-3xl text-lg leading-8 text-white/78">{copy.body}</p>
          </div>
          <div className="grid gap-3 rounded-[1.6rem] border border-white/10 bg-white/8 p-5">
            {[
              { label: copy.stats.trackedSkills, value: summary.uniqueSkillCount },
              { label: copy.stats.caseEntries, value: summary.caseEntryCount },
              { label: copy.stats.totalRuns, value: summary.totalRuns },
              { label: copy.stats.models, value: summary.modelCount },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl bg-white/8 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/60">{item.label}</div>
                <div className="mt-3 text-3xl font-semibold">{formatNumber(locale, item.value)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <input
            name="q"
            defaultValue={filters.q}
            placeholder={copy.filters.query}
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          />
          <select
            name="dataset"
            defaultValue={filters.dataset || ""}
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          >
            <option value="">{copy.filters.allDatasets}</option>
            <option value="obvious">{getDatasetLabel("obvious", locale)}</option>
            <option value="contextual">{getDatasetLabel("contextual", locale)}</option>
            <option value="hot100">{getDatasetLabel("hot100", locale)}</option>
          </select>
          <input
            name="vuln"
            defaultValue={filters.vuln}
            placeholder={copy.filters.vuln}
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          />
          <input
            name="model"
            defaultValue={filters.model}
            placeholder={copy.filters.model}
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          />
          <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white">
            {copy.filters.apply}
          </button>
        </form>
      </section>

      {sections.length ? (
        sections.map((section) => (
          <section key={section.id} className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold">{getDatasetLabel(section.id, locale)}</h2>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-600">
                {formatNumber(locale, section.records.length)} skills
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {section.records.map((record) => (
                <Link
                  key={`${section.id}-${record.slug}`}
                  href={`/skills/${record.slug}`}
                  className="grid gap-4 rounded-[1.6rem] border border-black/10 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                      {record.datasets.map((dataset) => (
                        <span key={dataset} className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                          {getDatasetLabel(dataset, locale)}
                        </span>
                      ))}
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                      {record.successfulEntries}/{record.entryCount} {copy.labels.successCoverage}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold">{record.skillLabel}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {record.representativeReason || copy.labels.noRepresentative}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        {copy.labels.representativeWin}
                      </div>
                      {record.firstSuccessfulEntry ? (
                        <div className="mt-2 text-slate-700">
                          {record.firstSuccessfulEntry.model}
                          <div className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                            {copy.labels.lane} {record.firstSuccessfulEntry.lane || "-"} · {copy.labels.round} {record.firstSuccessfulEntry.round || "-"}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-slate-500">{copy.labels.noRepresentative}</div>
                      )}
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        {copy.labels.models}
                      </div>
                      <div className="mt-2 text-slate-700">
                        {record.successfulModels}/{record.models.length}
                      </div>
                      <div className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {copy.labels.attackSuccess} {record.attackSuccess} · {copy.labels.technical} {record.technical}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                    {record.vulnLabels.map((label) => (
                      <span key={label} className="rounded-full bg-white px-3 py-1">
                        {label}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="rounded-[1.6rem] border border-dashed border-black/15 bg-white/70 p-10 text-sm text-slate-600">
          {copy.labels.empty}
        </div>
      )}
    </div>
  );
}
