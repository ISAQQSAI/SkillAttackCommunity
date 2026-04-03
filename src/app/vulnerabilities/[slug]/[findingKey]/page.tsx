import { notFound } from "next/navigation";

import { PublicFindingDetail } from "@/components/public-finding-detail";
import { findPublicCaseFinding } from "@/lib/public-case-routing";
import { getLocale } from "@/lib/server/locale";
import { getPublicCaseBySlug } from "@/lib/server/report-submissions";

export default async function VulnerabilityFindingPage({
  params,
}: {
  params: Promise<{ slug: string; findingKey: string }>;
}) {
  const locale = await getLocale();
  const { slug: rawSlug, findingKey: rawFindingKey } = await params;
  const slug = decodeURIComponent(rawSlug);
  const findingKey = decodeURIComponent(rawFindingKey);
  const publishedCase = await getPublicCaseBySlug(slug);

  if (!publishedCase) {
    notFound();
  }

  const matchedFinding = findPublicCaseFinding(publishedCase.payload, findingKey);

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
