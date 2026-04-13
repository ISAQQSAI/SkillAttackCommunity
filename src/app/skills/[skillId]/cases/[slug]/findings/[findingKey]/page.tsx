import { redirect } from "next/navigation";

import { getPublicFindingPath } from "@/lib/public-case-routing";

export default async function PublicFindingDetailPage({
  params,
}: {
  params: Promise<{ skillId: string; slug: string; findingKey: string }>;
}) {
  const { skillId: rawSkillId, slug: rawSlug, findingKey: rawFindingKey } = await params;
  const skillId = decodeURIComponent(rawSkillId);
  const slug = decodeURIComponent(rawSlug);
  const findingKey = decodeURIComponent(rawFindingKey);
  redirect(getPublicFindingPath({ slug, findingKey, reportSkillId: skillId }));
}
