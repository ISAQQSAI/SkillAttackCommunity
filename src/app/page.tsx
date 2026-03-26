import Link from "next/link";

import { getDictionary, translateVerificationBadge } from "@/lib/i18n";
import { getLocale } from "@/lib/server/locale";
import { getBackendSummary, getHomeSnapshot, listPublicFindingViews } from "@/lib/server/store";

export default async function HomePage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const snapshot = await getHomeSnapshot();
  const backend = await getBackendSummary();
  const latest = await listPublicFindingViews();
  const payload = (snapshot?.payload || {}) as {
    publishedCount?: number;
    verifiedCount?: number;
    reporterCount?: number;
    latestVerified?: Array<{
      reviewId: string;
      findingId: string;
      title?: string;
      verificationSummary?: string;
      createdAt: string;
    }>;
  };

  return (
    <div className="grid gap-8">
      <section className="overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(203,255,122,0.18),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(255,104,71,0.22),_transparent_24%),linear-gradient(135deg,_#0f172a,_#1e293b_55%,_#1d4d4f)] p-8 text-white shadow-[0_32px_120px_rgba(15,23,42,0.28)]">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
          <div className="grid gap-5">
            <div className="w-fit rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/75">
              {dict.home.heroBadge}
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.08em]">
              {dict.home.heroTitle}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-white/78">
              {dict.home.heroBody}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/submit" className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5">
                {dict.home.submit}
              </Link>
              <Link href="/review" className="rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
                {dict.home.review}
              </Link>
            </div>
          </div>
          <div className="grid gap-3 rounded-[1.6rem] border border-white/10 bg-white/8 p-5 text-sm text-white/80">
            <div className="flex items-center justify-between">
              <span>{dict.home.backend}</span>
              <span className="rounded-full bg-white/12 px-3 py-1 font-medium">{backend.mode}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-3xl bg-white/8 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/65">{dict.home.published}</div>
                <div className="mt-3 text-3xl font-semibold">{payload.publishedCount || 0}</div>
              </div>
              <div className="rounded-3xl bg-white/8 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/65">{dict.home.verified}</div>
                <div className="mt-3 text-3xl font-semibold">{payload.verifiedCount || 0}</div>
              </div>
              <div className="rounded-3xl bg-white/8 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/65">{dict.home.reporters}</div>
                <div className="mt-3 text-3xl font-semibold">{payload.reporterCount || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: dict.home.cards.findingsTitle,
            body: dict.home.cards.findingsBody,
            href: "/findings",
          },
          {
            title: dict.home.cards.leaderboardsTitle,
            body: dict.home.cards.leaderboardsBody,
            href: "/leaderboards",
          },
          {
            title: dict.home.cards.datasetsTitle,
            body: dict.home.cards.datasetsBody,
            href: "/datasets",
          },
          {
            title: dict.home.cards.modelsTitle,
            body: dict.home.cards.modelsBody,
            href: "/models",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[1.8rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
          >
            <h2 className="text-xl font-semibold">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{dict.home.latestPublishedTitle}</h2>
            <p className="text-sm text-slate-600">{dict.home.latestPublishedBody}</p>
          </div>
          <Link href="/findings" className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline">
            {dict.home.fullIndex}
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {latest.slice(0, 4).map((item) => (
            <Link
              key={item.published.id}
              href={`/findings/${item.published.slug}`}
              className="grid gap-3 rounded-[1.5rem] border border-black/8 bg-slate-50 p-5 transition hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm uppercase tracking-[0.18em] text-slate-500">{item.finding.datasetTag}</div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                  {translateVerificationBadge(item.published.verificationBadge, locale)}
                </div>
              </div>
              <h3 className="text-xl font-semibold">{item.published.publicTitle}</h3>
              <p className="text-sm leading-7 text-slate-600">{item.published.publicSummary}</p>
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                <span className="rounded-full bg-white px-3 py-1">{item.finding.vendor}</span>
                <span className="rounded-full bg-white px-3 py-1">{item.finding.vulnType}</span>
                {item.finding.modelTags.map((model) => (
                  <span key={model} className="rounded-full bg-white px-3 py-1">
                    {model}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{dict.home.latestVerifiedTitle}</h2>
            <p className="text-sm text-slate-600">{dict.home.latestVerifiedBody}</p>
          </div>
          <Link href="/review" className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline">
            {dict.home.openReview}
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {(payload.latestVerified || []).slice(0, 4).map((item) => (
            <div key={item.reviewId} className="rounded-[1.5rem] border border-black/8 bg-slate-50 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.createdAt.slice(0, 10)}</div>
              <h3 className="mt-3 text-xl font-semibold">{item.title || item.findingId}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {item.verificationSummary || dict.home.noVerificationSummary}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
