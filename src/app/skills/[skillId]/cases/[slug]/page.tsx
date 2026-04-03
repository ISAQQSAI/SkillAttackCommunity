import { redirect } from "next/navigation";

import { getPublicCasePath } from "@/lib/public-case-routing";

export default async function SkillCaseDetailPage({
  params,
}: {
  params: Promise<{ skillId: string; slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  redirect(getPublicCasePath({ slug }));
}
