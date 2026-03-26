import { getLeaderboardSnapshot } from "@/lib/server/store";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/server/locale";

export default async function LeaderboardsPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const snapshot = await getLeaderboardSnapshot();
  const payload = (snapshot?.payload || {}) as {
    reportersByPublished?: Array<{ userId: string; label: string; count: number }>;
    reportersByVerified?: Array<{ userId: string; label: string; count: number }>;
    skillsByPublished?: Array<{ label: string; count: number }>;
    vendorsByPublished?: Array<{ label: string; count: number }>;
  };

  const sections = [
    { title: dict.leaderboards.reportersByPublished, items: payload.reportersByPublished || [] },
    { title: dict.leaderboards.reportersByVerified, items: payload.reportersByVerified || [] },
    { title: dict.leaderboards.skillsByPublished, items: payload.skillsByPublished || [] },
    { title: dict.leaderboards.vendorsByPublished, items: payload.vendorsByPublished || [] },
  ];

  return (
    <div className="grid gap-6">
      <section className="rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-semibold tracking-tight">{dict.leaderboards.title}</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          {dict.leaderboards.body}
        </p>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <article key={section.title} className="rounded-[1.8rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <div className="mt-4 grid gap-3">
              {section.items.map((item, index) => (
                <div key={`${section.title}-${item.label}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-slate-950 text-center text-sm font-semibold leading-9 text-white">{index + 1}</div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className="text-sm text-slate-600">{item.count}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
