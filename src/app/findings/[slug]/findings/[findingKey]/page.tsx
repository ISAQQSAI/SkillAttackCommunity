import { redirect } from "next/navigation";

import { getPublicCasePath } from "@/lib/public-case-routing";

export default async function LegacyFindingDetailPage({
  params,
}: {
  params: Promise<{ slug: string; findingKey: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  redirect(getPublicCasePath({ slug }));
}
