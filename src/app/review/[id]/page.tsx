import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewActions } from "@/components/review-actions";
import { StatusBadge } from "@/components/status-badge";
import { getDictionary } from "@/lib/i18n";
import { getViewer } from "@/lib/server/auth";
import { getLocale } from "@/lib/server/locale";
import { getReviewFinding } from "@/lib/server/store";

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "admin") {
    return (
      <div className="rounded-[2rem] border border-dashed border-black/15 bg-white/80 p-10 text-sm text-slate-600">
        {dict.reviewDetail.accessRequired}
      </div>
    );
  }

  const { id } = await params;
  const detail = await getReviewFinding(id);
  if (!detail) {
    notFound();
  }

  const { finding, reporter, bundle, latestReview, duplicateCandidates, published } = detail;

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={finding.status} locale={locale} />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-600">{finding.datasetTag}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-600">{finding.severityClaim}</span>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{finding.title}</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">{finding.summary}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{dict.reviewDetail.reporter}</div>
            <div className="mt-3 text-lg font-semibold">{reporter?.name || finding.reporterId}</div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{dict.reviewDetail.skill}</div>
            <div className="mt-3 text-lg font-semibold">{finding.skillName}</div>
            <a href={finding.skillUrl} className="mt-1 block text-sm text-slate-600 underline-offset-4 hover:underline">
              {finding.skillUrl}
            </a>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{dict.reviewDetail.models}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {finding.modelTags.map((model) => (
                <span key={model} className="rounded-full bg-white px-3 py-1 text-sm">
                  {model}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{dict.reviewDetail.latestReview}</div>
            <div className="mt-3 text-sm leading-7 text-slate-700">
              {latestReview?.verificationSummary || latestReview?.reviewerNotes || dict.reviewDetail.noReviewerNote}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          {[
            { title: dict.reviewDetail.attackPrompt, body: finding.attackPrompt },
            { title: dict.reviewDetail.expectedRisk, body: finding.expectedRisk },
            { title: dict.reviewDetail.reproSteps, body: finding.reproSteps },
            { title: dict.reviewDetail.observedResult, body: finding.observedResult },
            { title: dict.reviewDetail.smokingGun, body: finding.smokingGun },
          ].map((block) => (
            <article key={block.title} className="rounded-[1.6rem] border border-black/10 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <h2 className="text-lg font-semibold">{block.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 whitespace-pre-wrap">{block.body}</p>
            </article>
          ))}

          <article className="rounded-[1.6rem] border border-black/10 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold">{dict.reviewDetail.artifactSummary}</h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                <strong className="block text-slate-950">{dict.reviewDetail.detectedFiles}</strong>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(bundle?.detectedFiles || []).map((file) => (
                    <span key={file} className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">
                      {file}
                    </span>
                  ))}
                </div>
              </div>
              {bundle?.extractedMetadata ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                  <div><strong>{dict.reviewDetail.verdict}:</strong> {bundle.extractedMetadata.verdict || dict.reviewDetail.unknown}</div>
                  <div><strong>{dict.reviewDetail.confidence}:</strong> {bundle.extractedMetadata.confidence || dict.reviewDetail.na}</div>
                  <div><strong>{dict.reviewDetail.skillId}:</strong> {bundle.extractedMetadata.skillId || dict.reviewDetail.na}</div>
                  <div><strong>{dict.reviewDetail.runId}:</strong> {bundle.extractedMetadata.runId || dict.reviewDetail.na}</div>
                  <div className="mt-3"><strong>{dict.reviewDetail.failureReason}:</strong> {bundle.extractedMetadata.failureReason || dict.reviewDetail.na}</div>
                </div>
              ) : null}
              {bundle?.artifacts.length ? (
                <div className="grid gap-3">
                  {bundle.artifacts.map((artifact) => (
                    <div key={artifact.id} className="rounded-2xl bg-slate-50 p-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <strong>{artifact.originalName}</strong>
                        <Link href={`/api/artifacts/${finding.id}/${artifact.id}`} target="_blank" className="text-slate-600 underline-offset-4 hover:underline">
                          {dict.reviewDetail.open}
                        </Link>
                      </div>
                      {artifact.preview ? <pre className="mt-3 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{artifact.preview}</pre> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        </div>

        <div className="grid gap-4">
          {duplicateCandidates.length ? (
            <article className="rounded-[1.6rem] border border-black/10 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <h2 className="text-lg font-semibold">{dict.reviewDetail.duplicateCandidates}</h2>
              <div className="mt-4 grid gap-3">
                {duplicateCandidates.map((candidate) => (
                  <div key={candidate.findingId} className="rounded-2xl bg-slate-50 p-4 text-sm">
                    <div className="font-medium">{candidate.title}</div>
                    <div className="mt-2 text-slate-600">{dict.reviewDetail.score} {candidate.score} · {candidate.reason}</div>
                  </div>
                ))}
              </div>
            </article>
          ) : null}
          <ReviewActions finding={finding} duplicateCandidates={duplicateCandidates} published={published} locale={locale} />
        </div>
      </section>
    </div>
  );
}
