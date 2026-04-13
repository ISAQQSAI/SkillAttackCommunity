import { notFound } from "next/navigation";

import { PublicFindingDetail } from "@/components/public-finding-detail";
import { findPublicCaseFinding } from "@/lib/public-case-routing";
import { getLocale } from "@/lib/server/locale";
import { getPublicCaseBySlug } from "@/lib/server/report-submissions";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VulnerabilityFindingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; findingKey: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();
  const { slug: rawSlug, findingKey: rawFindingKey } = await params;
  const query = await searchParams;
  const slug = decodeURIComponent(rawSlug);
  const findingKey = decodeURIComponent(rawFindingKey);
  const publishedCase = await getPublicCaseBySlug(slug);

  if (!publishedCase) {
    notFound();
  }

  const matchedFinding = findPublicCaseFinding(publishedCase.payload, findingKey, {
    reportSkillId: firstParam(query.skill),
    model: firstParam(query.model),
  });

  if (!matchedFinding) {
    notFound();
  }

  return (
    <PublicFindingDetail
      locale={locale}
      result={publishedCase}
      finding={matchedFinding.finding}
      findingIndex={matchedFinding.index}
    />
  );
}
