import { notFound } from "next/navigation";

import { PublicSurfaceDetail } from "@/components/public-surface-detail";
import { getLocale } from "@/lib/server/locale";
import { getPublicSurfaceBySlug } from "@/lib/server/public-skills";

export default async function VulnerabilityCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await getLocale();
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const result = await getPublicSurfaceBySlug(slug);

  if (!result) {
    notFound();
  }

  return <PublicSurfaceDetail locale={locale} surface={result} />;
}
