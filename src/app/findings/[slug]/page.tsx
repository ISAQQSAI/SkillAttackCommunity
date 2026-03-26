import Link from "next/link";
import { notFound } from "next/navigation";

import { getDictionary, translateEvidenceTitle, translateVerificationBadge } from "@/lib/i18n";
import { getLocale } from "@/lib/server/locale";
import { getPublicFindingBySlug } from "@/lib/server/store";

export default async function FindingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const { slug } = await params;
  const result = await getPublicFindingBySlug(slug);
  if (!result) {
    notFound();
  }

  const { finding, published, reporter } = result;

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-black/10 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-600">{finding.datasetTag}</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-800">{translateVerificationBadge(published.verificationBadge, locale)}</span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-rose-700">{finding.severityClaim}</span>
        </div>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight">{published.publicTitle}</h1>
        <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">{published.publicSummary}</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{dict.findingDetail.affectedSkill}</div>
            <div className="mt-3 text-lg font-semibold">{finding.skillName}</div>
            <a href={finding.skillUrl} className="mt-2 block text-sm text-slate-600 underline-offset-4 hover:underline">
              {finding.skillUrl}
            </a>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{dict.findingDetail.vendor}</div>
            <div className="mt-3 text-lg font-semibold">{finding.vendor}</div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{dict.findingDetail.models}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {finding.modelTags.map((model) => (
                <span key={model} className="rounded-full bg-white px-3 py-1 text-sm">
                  {model}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{dict.findingDetail.reporter}</div>
            <div className="mt-3 text-lg font-semibold">{reporter?.name || dict.findingDetail.anonymousReporter}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {published.publicEvidenceBlocks.map((block) => (
          <article key={block.title} className="rounded-[1.6rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold">{translateEvidenceTitle(block.title, locale)}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{block.content}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[1.8rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h2 className="text-2xl font-semibold">{dict.findingDetail.publicContext}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{dict.findingDetail.attackPrompt}</div>
            <p className="mt-3 text-sm leading-7 text-slate-700">{finding.attackPrompt}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{dict.findingDetail.reproSteps}</div>
            <p className="mt-3 text-sm leading-7 text-slate-700">{finding.reproSteps}</p>
          </div>
        </div>
        {published.publicArtifactLinks.length ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {published.publicArtifactLinks.map((artifact) => (
              <Link
                key={artifact.artifactId}
                href={`/api/artifacts/${finding.id}/${artifact.artifactId}`}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm"
                target="_blank"
              >
                {dict.findingDetail.download} {artifact.label}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-slate-500">{dict.findingDetail.noArtifacts}</p>
        )}
      </section>

      {finding.externalReferences.length ? (
        <section className="rounded-[1.8rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-semibold">{dict.findingDetail.externalReferences}</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {finding.externalReferences.map((reference) => (
              <a
                key={reference}
                href={reference}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm underline-offset-4 hover:underline"
                target="_blank"
              >
                {reference}
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
