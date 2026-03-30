import Link from "next/link";

import { actionButtonClass, InsetCard, PageHero } from "@/components/page-chrome";
import { getLocale } from "@/lib/server/locale";

export default async function ReportDetailFallbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const { id } = await params;

  return (
    <div className="grid gap-6">
      <PageHero
        title={locale === "zh" ? "需要 tracking token" : "Tracking token required"}
        description={
          locale === "zh"
            ? "新的 guest 提交流程不再使用旧的按账号查看详情页。请使用 submission ID 和 tracking token 到状态查询页查看审核进度。"
            : "The guest submission flow no longer uses the legacy account-bound detail page. Use your submission ID and tracking token on the tracking page instead."
        }
        actions={
          <>
            <Link href={`/reports?id=${encodeURIComponent(id)}`} className={actionButtonClass("primary")}>
              {locale === "zh" ? "前往状态查询页" : "Open tracking page"}
            </Link>
            <Link href="/submit" className={actionButtonClass("secondary")}>
              {locale === "zh" ? "返回上传页" : "Back to upload"}
            </Link>
          </>
        }
        aside={
          <InsetCard tone="tint">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              {locale === "zh" ? "当前 ID" : "Current ID"}
            </div>
            <div className="mt-3 break-all text-sm leading-7 text-slate-700">{id}</div>
          </InsetCard>
        }
      />
    </div>
  );
}
