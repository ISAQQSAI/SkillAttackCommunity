import Link from "next/link";
import { notFound } from "next/navigation";

import { getLocale } from "@/lib/server/locale";
import { skillAttackLinks } from "@/lib/skillattack-links";
import {
  getDatasetLabel,
  getSkillVaultCopy,
  getSkillVaultRecord,
  getVerdictLabel,
} from "@/lib/skill-vault";

function formatNumber(locale: string, value: number, suffix?: string) {
  const formatted = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

  return `${formatted}${suffix || ""}`;
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const locale = await getLocale();
  const copy = getSkillVaultCopy(locale);
  const { skillId } = await params;
  const record = getSkillVaultRecord(skillId);

  if (!record) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/skills" className="text-sm font-medium text-slate-600 underline-offset-4 hover:underline">
            {copy.labels.vaultIndex}
          </Link>
          {record.datasets.map((dataset) => (
            <span key={dataset} className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-600">
              {getDatasetLabel(dataset, locale)}
            </span>
          ))}
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">{record.skillLabel}</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">{record.representativeReason || copy.labels.noRepresentative}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{copy.labels.skillId}</div>
            <div className="mt-3 text-lg font-semibold">{record.skillId}</div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{copy.labels.successCoverage}</div>
            <div className="mt-3 text-lg font-semibold">
              {record.successfulEntries}/{record.entryCount}
            </div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{copy.labels.totalRuns}</div>
            <div className="mt-3 text-lg font-semibold">{formatNumber(locale, record.totalRuns)}</div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{copy.labels.attackSuccess}</div>
            <div className="mt-3 text-lg font-semibold">{formatNumber(locale, record.attackSuccess)}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.6rem] border border-black/8 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold">{copy.labels.representativeWin}</h2>
            {record.firstSuccessfulEntry ? (
              <div className="mt-4 grid gap-3 text-sm text-slate-700">
                <div>
                  {record.firstSuccessfulEntry.model} · {getDatasetLabel(record.firstSuccessfulEntry.dataset, locale)}
                </div>
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <span className="rounded-full bg-white px-3 py-1">
                    {copy.labels.lane} {record.firstSuccessfulEntry.lane || "-"}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1">
                    {copy.labels.round} {record.firstSuccessfulEntry.round || "-"}
                  </span>
                  {record.firstSuccessfulEntry.confidence !== null ? (
                    <span className="rounded-full bg-white px-3 py-1">
                      {copy.labels.confidence} {formatNumber(locale, record.firstSuccessfulEntry.confidence)}
                    </span>
                  ) : null}
                </div>
                <p className="leading-7 text-slate-600">{record.firstSuccessfulEntry.reason}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">{copy.labels.noRepresentative}</p>
            )}
          </div>

          <div className="rounded-[1.6rem] border border-black/8 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold">{copy.labels.vulnTypes}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {record.vulnLabels.map((label) => (
                <span key={label} className="rounded-full bg-white px-3 py-2 text-sm text-slate-700">
                  {label}
                </span>
              ))}
            </div>

            <h2 className="mt-6 text-lg font-semibold">{copy.labels.models}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {record.models.map((model) => (
                <span key={model} className="rounded-full bg-white px-3 py-2 text-sm text-slate-700">
                  {model}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{copy.labels.executionTraces}</h2>
            <p className="text-sm leading-7 text-slate-600">{copy.labels.executionBody}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={skillAttackLinks.repoUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline">
              {copy.labels.openRepo}
            </a>
            <a href={skillAttackLinks.showcaseUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline">
              {copy.labels.openShowcase}
            </a>
            <a href={skillAttackLinks.arxivUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline">
              {copy.labels.openArxiv}
            </a>
          </div>
        </div>

        <div className="grid gap-4">
          {record.entries.map((entry) => (
            <div key={entry.id} className="grid gap-4 rounded-[1.6rem] border border-black/8 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <span className="rounded-full bg-white px-3 py-1">{getDatasetLabel(entry.dataset, locale)}</span>
                  <span className="rounded-full bg-white px-3 py-1">{entry.model}</span>
                  <span className="rounded-full bg-white px-3 py-1">{copy.labels.lane} {entry.lane || "-"}</span>
                  <span className="rounded-full bg-white px-3 py-1">{copy.labels.round} {entry.round || "-"}</span>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                  {getVerdictLabel(entry.verdict, locale)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                {entry.vulnLabels.map((label) => (
                  <span key={label} className="rounded-full bg-white px-3 py-1">
                    {label}
                  </span>
                ))}
              </div>

              <p className="text-sm leading-7 text-slate-600">{entry.reason}</p>

              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl bg-white p-4 text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.labels.totalRuns}</div>
                  <div className="mt-2 font-semibold text-slate-950">{formatNumber(locale, entry.totalRuns)}</div>
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.labels.attackSuccess}</div>
                  <div className="mt-2 font-semibold text-slate-950">{formatNumber(locale, entry.attackSuccess)}</div>
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.labels.ignored}</div>
                  <div className="mt-2 font-semibold text-slate-950">{formatNumber(locale, entry.ignored)}</div>
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.labels.technical}</div>
                  <div className="mt-2 font-semibold text-slate-950">{formatNumber(locale, entry.technical)}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                {entry.confidence !== null ? (
                  <span className="rounded-full bg-white px-3 py-2">
                    {copy.labels.confidence} {formatNumber(locale, entry.confidence)}
                  </span>
                ) : null}
                <span className="rounded-full bg-white px-3 py-2">
                  {copy.labels.score} {formatNumber(locale, entry.score)}
                </span>
                <span className="rounded-full bg-white px-3 py-2">
                  ASR {formatNumber(locale, entry.attackSuccessRate, "%")}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-700">
                <a href={entry.summaryUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                  {copy.labels.summaryJson}
                </a>
                {entry.artifactUrl ? (
                  <a href={entry.artifactUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                    {copy.labels.artifactDirectory}
                  </a>
                ) : (
                  <span className="text-slate-500">{copy.labels.artifactUnavailable}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
