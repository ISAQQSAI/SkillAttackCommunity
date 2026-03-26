import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { canEditFinding } from "@/lib/community";
import { getViewer } from "@/lib/server/auth";
import { getViewerFinding } from "@/lib/server/store";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <div className="rounded-[2rem] border border-dashed border-black/15 bg-white/80 p-10 text-sm text-slate-600">
        Sign in to view report status.
      </div>
    );
  }

  const { id } = await params;
  const detail = await getViewerFinding(id, viewer);
  if (!detail) {
    notFound();
  }

  const { finding, bundle, latestReview, published } = detail;
  const editable = canEditFinding(finding.status);

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={finding.status} />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-600">
            {finding.datasetTag}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-600">
            {finding.severityClaim}
          </span>
          {published ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-700">
              public case live
            </span>
          ) : null}
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{finding.title}</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">{finding.summary}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {editable ? (
            <Link href={`/submit?id=${finding.id}`} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white">
              Continue editing
            </Link>
          ) : null}
          {published ? (
            <Link href={`/findings/${published.slug}`} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm">
              Open public case page
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          {[
            { title: "Attack prompt", body: finding.attackPrompt },
            { title: "Expected risk", body: finding.expectedRisk },
            { title: "Reproduction steps", body: finding.reproSteps },
            { title: "Observed result", body: finding.observedResult },
            { title: "Smoking gun", body: finding.smokingGun },
          ].map((block) => (
            <article key={block.title} className="rounded-[1.6rem] border border-black/10 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <h2 className="text-lg font-semibold">{block.title}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{block.body}</p>
            </article>
          ))}

          {finding.externalReferences.length ? (
            <article className="rounded-[1.6rem] border border-black/10 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <h2 className="text-lg font-semibold">External references</h2>
              <div className="mt-4 grid gap-3">
                {finding.externalReferences.map((reference) => (
                  <a key={reference} href={reference} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 underline-offset-4 hover:underline">
                    {reference}
                  </a>
                ))}
              </div>
            </article>
          ) : null}
        </div>

        <div className="grid gap-4">
          <article className="rounded-[1.6rem] border border-black/10 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold">Review state</h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                <div>
                  <strong>Status:</strong> {finding.status}
                </div>
                <div>
                  <strong>Submitted:</strong> {finding.submittedAt || "not submitted yet"}
                </div>
                <div>
                  <strong>Duplicate target:</strong> {finding.duplicateOfId || "none"}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                <strong className="block text-slate-950">Latest reviewer note</strong>
                <p className="mt-2">
                  {latestReview?.verificationSummary || latestReview?.reviewerNotes || "No reviewer note yet."}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.6rem] border border-black/10 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold">Artifact summary</h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                <strong className="block text-slate-950">Detected files</strong>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(bundle?.detectedFiles || []).map((file) => (
                    <span key={file} className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">
                      {file}
                    </span>
                  ))}
                  {!bundle?.detectedFiles.length ? <span className="text-slate-500">No artifacts attached yet.</span> : null}
                </div>
              </div>
              {bundle?.redactionFlags.length ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <strong className="block">Redaction flags</strong>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {bundle.redactionFlags.map((flag) => (
                      <span key={flag} className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.16em]">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
