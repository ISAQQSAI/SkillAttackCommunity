import { notFound, redirect } from "next/navigation";

import { PublicCaseDetail } from "@/components/public-case-detail";
import { getLocale } from "@/lib/server/locale";
import { getPublicCasePath, getPrimaryPublicCaseSkillId } from "@/lib/public-case-routing";
import { getPublicCaseBySlug } from "@/lib/server/report-submissions";

export default async function FindingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await getLocale();
  const { slug } = await params;
  const result = await getPublicCaseBySlug(slug);

  if (!result) {
    notFound();
  }

  const publicSkillId = getPrimaryPublicCaseSkillId(result.payload);
  if (publicSkillId) {
    redirect(getPublicCasePath({ slug: result.slug, payload: result.payload }));
  }

  return <PublicCaseDetail locale={locale} result={result} />;
}
