import Link from "next/link";
import { notFound } from "next/navigation";

import { RawReportModal } from "@/components/raw-report-modal";
import { getLocale } from "@/lib/server/locale";
import { getSkillVaultCopy, getSkillVaultRecord, getVerdictLabel } from "@/lib/skill-vault";

function formatNumber(locale: string, value: number, suffix?: string) {
  const formatted = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

  return `${formatted}${suffix || ""}`;
}

function verdictBadgeClasses(verdict: string) {
  switch (verdict) {
    case "attack_success":
      return "bg-emerald-100 text-emerald-800";
    case "technical":
      return "bg-amber-100 text-amber-900";
    case "ignored":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const locale = await getLocale();
  const copy = getSkillVaultCopy(locale);
  const { skillId } = await params;
  const record = await getSkillVaultRecord(skillId);

  if (!record) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/skills" className="text-sm font-medium text-slate-600 underline-offset-4 hover:underline">
            {copy.labels.backToVault}
          </Link>
          {record.ordinal ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-600">
              #{record.ordinal}
            </span>
          ) : null}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-600">
            {record.ownerLabel}
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-800">
            {record.primaryHarmType}
          </span>
        </div>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight">{record.skillLabel}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">{record.skillId}</p>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
          {record.representativeSummary || copy.labels.noRepresentative}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {record.sourceLink ? (
            <a
              href={record.sourceLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm"
            >
              {copy.labels.openSource}
            </a>
          ) : null}
          {record.skillArchiveUrl ? (
            <a
              href={record.skillArchiveUrl}
              download
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium !text-white no-underline visited:!text-white hover:bg-slate-800"
              style={{ color: "#ffffff" }}
            >
              {copy.labels.downloadSkill}
            </a>
          ) : (
            <span className="rounded-full border border-dashed border-black/15 px-4 py-2 text-sm text-slate-500">
              {copy.labels.noArchive}
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{copy.labels.skillId}</div>
            <div className="mt-3 text-lg font-semibold">{record.skillId}</div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{copy.labels.reports}</div>
            <div className="mt-3 text-lg font-semibold">{formatNumber(locale, record.reportCount)}</div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{copy.labels.models}</div>
            <div className="mt-3 text-lg font-semibold">{formatNumber(locale, record.modelCount)}</div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{copy.labels.successCoverage}</div>
            <div className="mt-3 text-lg font-semibold">
              {formatNumber(locale, record.successCount)}/{formatNumber(locale, record.reportCount)}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.6rem] border border-black/8 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold">{copy.labels.representativeCase}</h2>
            {record.representativeReport ? (
              <div className="mt-4 grid gap-3 text-sm text-slate-700">
                <div>
                  {record.representativeReport.model}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                    <span className="rounded-full bg-white px-3 py-1">
                      {copy.labels.lane} {record.representativeReport.lane || "-"}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1">
                      {copy.labels.round} {record.representativeReport.round || "-"}
                    </span>
                    {record.representativeReport.confidence !== null ? (
                      <span className="rounded-full bg-white px-3 py-1">
                        {copy.labels.confidence} {formatNumber(locale, record.representativeReport.confidence)}
                      </span>
                    ) : null}
                  </div>
                </div>
                {record.representativeReport.evidenceSummary ? (
                  <p className="leading-7 text-slate-600">{record.representativeReport.evidenceSummary}</p>
                ) : null}
                <p className="leading-7 text-slate-600">
                  {record.representativeReport.smokingGunExcerpt || record.representativeReport.finalResponseExcerpt}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">{copy.labels.noRepresentative}</p>
            )}
          </div>

          <div className="rounded-[1.6rem] border border-black/8 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold">{copy.labels.primaryRisk}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {record.harmTypes.map((label) => (
                <span key={label} className="rounded-full bg-white px-3 py-2 text-sm text-slate-700">
                  {label}
                </span>
              ))}
            </div>

            <h2 className="mt-6 text-lg font-semibold">{copy.labels.primarySurface}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {record.surfaceLabels.map((label) => (
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
            <h2 className="text-2xl font-semibold">{copy.labels.reportTrail}</h2>
            <p className="text-sm leading-7 text-slate-600">{copy.labels.reportTrailBody}</p>
          </div>
        </div>

        <div className="grid gap-4">
          {record.reports.map((report) => (
            <article key={report.id} className="grid gap-4 rounded-[1.6rem] border border-black/8 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <span className="rounded-full bg-white px-3 py-1">{report.model}</span>
                  <span className="rounded-full bg-white px-3 py-1">
                    {copy.labels.lane} {report.lane || "-"}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1">
                    {copy.labels.round} {report.round || "-"}
                  </span>
                  {report.provider ? <span className="rounded-full bg-white px-3 py-1">{report.provider}</span> : null}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${verdictBadgeClasses(report.verdict)}`}
                >
                  {getVerdictLabel(report.verdict, locale)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                <span className="rounded-full bg-white px-3 py-1">{report.harmType}</span>
                {report.vulnerabilitySurface ? (
                  <span className="rounded-full bg-white px-3 py-1">{report.vulnerabilitySurface}</span>
                ) : null}
                {report.confidence !== null ? (
                  <span className="rounded-full bg-white px-3 py-1">
                    {copy.labels.confidence} {formatNumber(locale, report.confidence)}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-white p-4 text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.labels.evidenceSummary}</div>
                  <div className="mt-2 text-slate-700">{report.evidenceSummary || "-"}</div>
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.labels.generatedAt}</div>
                  <div className="mt-2 text-slate-700">{report.generatedAt || "-"}</div>
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.labels.observedPaths}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {report.observedPaths.length ? (
                      report.observedPaths.map((item) => (
                        <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.labels.predictedTools}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {report.predictedTools.length ? (
                      report.predictedTools.map((item) => (
                        <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <div className="rounded-2xl bg-white p-4 text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.labels.harmfulPrompt}</div>
                  <p className="mt-2 leading-7 text-slate-700">{report.harmfulPromptExcerpt || "-"}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.labels.smokingGun}</div>
                  {report.smokingGun.length ? (
                    <div className="mt-2 grid gap-2">
                      {report.smokingGun.map((item) => (
                        <p key={item} className="leading-7 text-slate-700">
                          {item}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 leading-7 text-slate-500">-</p>
                  )}
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{copy.labels.finalResponse}</div>
                  <p className="mt-2 leading-7 text-slate-700">{report.finalResponseExcerpt || "-"}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-700">
                <RawReportModal
                  triggerLabel={copy.labels.viewRawReport}
                  panelLabel={copy.labels.rawReportPanel}
                  closeLabel={copy.labels.closePanel}
                  loadingLabel={copy.labels.rawJsonLoading}
                  errorLabel={copy.labels.rawJsonError}
                  openInNewTabLabel={copy.labels.openInNewTab}
                  title={`${report.model} · ${copy.labels.rawReport}`}
                  subtitle={report.fileName}
                  reportUrl={report.reportUrl}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
