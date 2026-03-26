import Link from "next/link";

import { getLocale } from "@/lib/server/locale";
import { pickLocalizedText, skillAttackShowcase } from "@/lib/skillattack-showcase";

function formatNumber(locale: string, value: number, suffix?: string) {
  const formatted = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
  return `${formatted}${suffix || ""}`;
}

export default async function ShowcasePage() {
  const locale = await getLocale();

  return (
    <div className="grid gap-8">
      <section className="overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(203,255,122,0.18),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(255,104,71,0.22),_transparent_24%),linear-gradient(135deg,_#0f172a,_#1e293b_55%,_#3b1d2e)] p-8 text-white shadow-[0_32px_120px_rgba(15,23,42,0.28)]">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr] lg:items-end">
          <div className="grid gap-5">
            <div className="w-fit rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/75">
              {pickLocalizedText(locale, skillAttackShowcase.heroBadge)}
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.08em]">
              {pickLocalizedText(locale, skillAttackShowcase.heroTitle)}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-white/80">
              {pickLocalizedText(locale, skillAttackShowcase.heroBody)}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={skillAttackShowcase.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
              >
                {pickLocalizedText(locale, skillAttackShowcase.linkLabels.repo)}
              </a>
              <a
                href={skillAttackShowcase.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                {pickLocalizedText(locale, skillAttackShowcase.linkLabels.live)}
              </a>
            </div>
          </div>

          <div className="grid gap-4 rounded-[1.8rem] border border-white/10 bg-white/8 p-5 text-sm text-white/80">
            <div className="rounded-[1.4rem] border border-white/12 bg-black/10 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/60">
                {pickLocalizedText(locale, skillAttackShowcase.snapshotLabel)}
              </div>
              <div className="mt-3 text-2xl font-semibold">{skillAttackShowcase.snapshotGeneratedAt}</div>
              <p className="mt-3 leading-7 text-white/72">
                {pickLocalizedText(locale, skillAttackShowcase.snapshotBody)}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-white/12 bg-black/10 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/60">
                {pickLocalizedText(locale, skillAttackShowcase.relationshipBadge)}
              </div>
              <h2 className="mt-3 text-xl font-semibold">
                {pickLocalizedText(locale, skillAttackShowcase.relationshipTitle)}
              </h2>
              <p className="mt-3 leading-7 text-white/72">
                {pickLocalizedText(locale, skillAttackShowcase.relationshipBody)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {skillAttackShowcase.metrics.map((item) => (
          <div
            key={item.id}
            className="rounded-[1.6rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {pickLocalizedText(locale, item.label)}
            </div>
            <div className="mt-3 text-4xl font-semibold text-slate-950">
              {formatNumber(locale, item.value, item.suffix)}
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {pickLocalizedText(locale, item.detail)}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4 rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div>
            <h2 className="text-2xl font-semibold">
              {pickLocalizedText(locale, skillAttackShowcase.sections.workflowTitle)}
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {pickLocalizedText(locale, skillAttackShowcase.sections.workflowBody)}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {skillAttackShowcase.workflow.map((step, index) => (
              <div key={step.id} className="rounded-[1.4rem] border border-black/8 bg-slate-50 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-3 text-lg font-semibold">
                  {pickLocalizedText(locale, step.title)}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {pickLocalizedText(locale, step.body)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div>
            <h2 className="text-2xl font-semibold">
              {pickLocalizedText(locale, skillAttackShowcase.sections.capabilitiesTitle)}
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {pickLocalizedText(locale, skillAttackShowcase.sections.capabilitiesBody)}
            </p>
          </div>
          <div className="grid gap-3">
            {skillAttackShowcase.capabilities.map((item) => (
              <div key={item.id} className="rounded-[1.4rem] border border-black/8 bg-slate-50 p-5">
                <h3 className="text-lg font-semibold">{pickLocalizedText(locale, item.title)}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {pickLocalizedText(locale, item.body)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              {pickLocalizedText(locale, skillAttackShowcase.sections.datasetsTitle)}
            </h2>
            <p className="text-sm leading-7 text-slate-600">
              {pickLocalizedText(locale, skillAttackShowcase.sections.datasetsBody)}
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-600">
            {pickLocalizedText(locale, skillAttackShowcase.sections.modelsTitle)}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {skillAttackShowcase.datasets.map((dataset) => (
            <div key={dataset.id} className="rounded-[1.6rem] border border-black/8 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{dataset.label}</div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  {formatNumber(locale, dataset.attackSuccessRate, "%")} ASR
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {pickLocalizedText(locale, dataset.description)}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    {pickLocalizedText(locale, skillAttackShowcase.datasetStatLabels.runs)}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-slate-950">
                    {formatNumber(locale, dataset.totalRuns)}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    {pickLocalizedText(locale, skillAttackShowcase.datasetStatLabels.success)}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-slate-950">
                    {formatNumber(locale, dataset.attackSuccess)}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    {pickLocalizedText(locale, skillAttackShowcase.datasetStatLabels.technical)}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-slate-950">
                    {formatNumber(locale, dataset.technicalRate, "%")}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    {pickLocalizedText(locale, skillAttackShowcase.datasetStatLabels.cases)}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-slate-950">
                    {formatNumber(locale, dataset.caseCount)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 rounded-[1.6rem] border border-dashed border-black/15 bg-slate-50 p-5">
          <div className="text-sm font-medium text-slate-700">
            {pickLocalizedText(locale, skillAttackShowcase.sections.modelsBody)}
          </div>
          <div className="flex flex-wrap gap-2">
            {skillAttackShowcase.models.map((model) => (
              <span key={model} className="rounded-full bg-white px-3 py-2 text-sm text-slate-700">
                {model}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div>
          <h2 className="text-2xl font-semibold">
            {pickLocalizedText(locale, skillAttackShowcase.sections.featuredCasesTitle)}
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-600">
            {pickLocalizedText(locale, skillAttackShowcase.sections.featuredCasesBody)}
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {skillAttackShowcase.featuredCases.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 rounded-[1.6rem] border border-black/8 bg-slate-50 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <span className="rounded-full bg-white px-3 py-1">{item.dataset}</span>
                  <span className="rounded-full bg-white px-3 py-1">{item.model}</span>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                  {pickLocalizedText(locale, skillAttackShowcase.verdictLabels[item.verdict])}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-semibold">{item.skillLabel}</h3>
                <div className="mt-2 text-sm font-medium text-slate-700">{item.vulnLabel}</div>
              </div>

              <p className="text-sm leading-7 text-slate-600">
                {pickLocalizedText(locale, item.summary)}
              </p>

              <div className="rounded-[1.2rem] border border-black/8 bg-white p-4 text-sm leading-7 text-slate-700">
                {pickLocalizedText(locale, item.evidence)}
              </div>

              <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-700">
                <a href={item.summaryUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                  {pickLocalizedText(locale, skillAttackShowcase.linkLabels.summary)}
                </a>
                {item.artifactUrl ? (
                  <a href={item.artifactUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                    {pickLocalizedText(locale, skillAttackShowcase.linkLabels.artifacts)}
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(29,78,216,0.88))] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <h2 className="text-2xl font-semibold">
            {pickLocalizedText(locale, skillAttackShowcase.sections.ctaTitle)}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/78">
            {pickLocalizedText(locale, skillAttackShowcase.sections.ctaBody)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <a
            href={skillAttackShowcase.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
          >
            {pickLocalizedText(locale, skillAttackShowcase.linkLabels.repo)}
          </a>
          <a
            href={skillAttackShowcase.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            {pickLocalizedText(locale, skillAttackShowcase.linkLabels.live)}
          </a>
          <Link
            href="/findings"
            className="rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            {pickLocalizedText(locale, skillAttackShowcase.linkLabels.community)}
          </Link>
        </div>
      </section>
    </div>
  );
}
