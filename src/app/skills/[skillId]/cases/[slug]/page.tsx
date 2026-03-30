import { notFound, redirect } from "next/navigation";

import { PublicCaseDetail } from "@/components/public-case-detail";
import { getLocale } from "@/lib/server/locale";
import {
  getPrimaryPublicCaseSkillId,
  getPublicCasePath,
  getPublicCaseSkillIds,
} from "@/lib/public-case-routing";
import { getPublicCaseBySlug } from "@/lib/server/report-submissions";

export default async function SkillCaseDetailPage({
  params,
}: {
  params: Promise<{ skillId: string; slug: string }>;
}) {
  const locale = await getLocale();
  const { skillId: rawSkillId, slug } = await params;
  const skillId = decodeURIComponent(rawSkillId);
  const result = await getPublicCaseBySlug(slug);

  if (!result) {
    notFound();
  }

  const coveredSkillIds = getPublicCaseSkillIds(result.payload);
  if (coveredSkillIds.length && !coveredSkillIds.includes(skillId)) {
    redirect(getPublicCasePath({ slug: result.slug, payload: result.payload }));
  }

  const fallbackSkillId = getPrimaryPublicCaseSkillId(result.payload);
  return <PublicCaseDetail locale={locale} result={result} skillContextId={skillId || fallbackSkillId} />;
}
