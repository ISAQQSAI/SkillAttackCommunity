import { notFound, redirect } from "next/navigation";

import { PublicCaseDetail } from "@/components/public-case-detail";
import { PublicSurfaceDetail } from "@/components/public-surface-detail";
import {
  getPrimaryPublicFindingKey,
  getPublicFindingPath,
} from "@/lib/public-case-routing";
import { getLocale } from "@/lib/server/locale";
import { getPublicCaseBySlug } from "@/lib/server/report-submissions";
import { getPublicSurfaceBySlug } from "@/lib/server/public-skills";

export const dynamic = "force-dynamic";

export default async function VulnerabilityCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await getLocale();
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const publishedCase = await getPublicCaseBySlug(slug);

  if (publishedCase) {
    const firstFindingKey = getPrimaryPublicFindingKey(publishedCase.payload);

    if (firstFindingKey) {
      redirect(
        getPublicFindingPath({
          slug: publishedCase.slug,
          findingKey: firstFindingKey,
        })
      );
    }

    return <PublicCaseDetail locale={locale} result={publishedCase} />;
  }

  const result = await getPublicSurfaceBySlug(slug);

  if (!result) {
    notFound();
  }

  return <PublicSurfaceDetail locale={locale} surface={result} />;
}
