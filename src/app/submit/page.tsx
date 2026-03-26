import Link from "next/link";

import { SubmitFindingForm } from "@/components/submit-finding-form";
import { getDictionary } from "@/lib/i18n";
import { canEditFinding } from "@/lib/community";
import { getViewer } from "@/lib/server/auth";
import { getLocale } from "@/lib/server/locale";
import { getViewerFinding } from "@/lib/server/store";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <div className="rounded-[2rem] border border-dashed border-black/15 bg-white/80 p-10 text-sm text-slate-600">
        {dict.submitPage.signInRequired}
      </div>
    );
  }

  const params = await searchParams;
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const existing = id ? await getViewerFinding(id, viewer) : null;

  if (id && !existing) {
    return (
      <div className="rounded-[2rem] border border-dashed border-black/15 bg-white/80 p-10 text-sm text-slate-600">
        {dict.submitPage.notVisible}
      </div>
    );
  }

  if (existing && !canEditFinding(existing.finding.status)) {
    return (
      <div className="grid gap-4 rounded-[2rem] border border-black/10 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h1 className="text-2xl font-semibold tracking-tight">{dict.submitPage.lockedTitle}</h1>
        <p className="text-sm leading-7 text-slate-600">
          {dict.submitPage.lockedBody}
        </p>
        <Link href={`/reports/${existing.finding.id}`} className="w-fit rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white">
          {dict.submitPage.openDetail}
        </Link>
      </div>
    );
  }

  return <SubmitFindingForm initialFinding={existing?.finding} locale={locale} />;
}
