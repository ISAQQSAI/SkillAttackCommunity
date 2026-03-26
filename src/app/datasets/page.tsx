import Link from "next/link";

import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/server/locale";
import { getDatasetSnapshot } from "@/lib/server/store";

export default async function DatasetsPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const snapshot = await getDatasetSnapshot();
  const items = ((snapshot?.payload || {}) as { items?: Array<{ label: string; count: number; findings: Array<{ slug: string; publicTitle: string }> }> }).items || [];

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-semibold tracking-tight">{dict.datasets.title}</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          {dict.datasets.body}
        </p>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <article key={item.label} className="rounded-[1.8rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{item.label}</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{item.count} {dict.datasets.findings}</span>
            </div>
            <div className="mt-4 grid gap-3">
              {item.findings.map((finding) => (
                <Link key={finding.slug} href={`/findings/${finding.slug}`} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:-translate-y-0.5">
                  {finding.publicTitle}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
