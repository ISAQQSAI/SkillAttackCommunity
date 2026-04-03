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
        title={locale === "zh" ? "使用提交编号查询" : "Look up by submission number"}
        description={
          locale === "zh"
            ? "新的提交流程统一通过提交编号查询状态。直接带着当前 ID 去状态查询页即可。"
            : "The current submission flow uses the submission number as the lookup key. Open the tracking page with this ID."
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
