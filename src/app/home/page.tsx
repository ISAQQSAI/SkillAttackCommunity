import { CommunityHomePage } from "@/components/community-home-page";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CommunityHomeRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <CommunityHomePage
      risk={firstParam(params.risk)}
      result={firstParam(params.result)}
      level={firstParam(params.level)}
    />
  );
}
