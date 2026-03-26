import { getModelSnapshot } from "@/lib/server/store";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/server/locale";

export default async function ModelsPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const snapshot = await getModelSnapshot();
  const items = ((snapshot?.payload || {}) as {
    items?: Array<{ label: string; count: number; affectedSkillCount: number; verdicts: Record<string, number> }>;
  }).items || [];

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-semibold tracking-tight">{dict.models.title}</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          {dict.models.body}
        </p>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <article key={item.label} className="rounded-[1.8rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{item.label}</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{item.count} {dict.models.findings}</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{dict.models.affectedSkills}</div>
                <div className="mt-3 text-3xl font-semibold">{item.affectedSkillCount}</div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{dict.models.verdicts}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(item.verdicts).map(([verdict, count]) => (
                    <span key={verdict} className="rounded-full bg-white px-3 py-1 text-sm">
                      {verdict}: {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
