import Link from "next/link";

import {
  actionButtonClass,
  EmptyState,
  InsetCard,
  PageHero,
  PageStat,
  SectionHeading,
  SurfaceCard,
} from "@/components/page-chrome";
import { HomeActionRail } from "@/components/home-action-rail";
import { getViewer } from "@/lib/server/auth";
import { getLocale } from "@/lib/server/locale";
import { getCommunitySnapshot } from "@/lib/server/report-submissions";
import { listPublicSkills } from "@/lib/server/public-skills";

export async function CommunityHomePage() {
  const locale = await getLocale();
  const viewer = await getViewer();
  const snapshot = await getCommunitySnapshot();
  const skills = await listPublicSkills({ limit: 4 });

  return (
    <div className="grid gap-8">
      <PageHero
        tone="dark"
        eyebrow={locale === "zh" ? "案例主页 · Guest 提交 + Admin 审核" : "Case home · guest submission + admin review"}
        title={
          locale === "zh"
            ? "按 skill 浏览公开案例，右侧直接上传 bundle 或查询提交状态。"
            : "Browse the public library by skill while using the right rail to upload bundles or track submissions."
        }
        description={
          locale === "zh"
            ? "首页主体优先展示按 skill 聚合后的公开案例。原始 zip、原始 JSON、完整轨迹和 skill archive 仍然只保留在内部审核流里，公开区只展示结构化摘要。"
            : "The home page prioritizes the public library grouped by skill. Raw zips, raw JSON, full trajectories, and skill archives remain inside the internal review flow while the public UI only shows structured summaries."
        }
        actions={
          <>
            <Link href="/skills" className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5">
              {locale === "zh" ? "浏览技能案例库" : "Browse public skills"}
            </Link>
            <Link href="/submit" className="rounded-full border border-white/14 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:text-white">
              {locale === "zh" ? "上传 bundle" : "Upload bundle"}
            </Link>
            <Link href="/reports" className="rounded-full border border-white/14 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:text-white">
              {locale === "zh" ? "查询提交" : "Track submission"}
            </Link>
            {viewer?.role === "admin" ? (
              <Link href="/review" className="rounded-full border border-white/14 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:text-white">
                {locale === "zh" ? "管理员审核" : "Admin review"}
              </Link>
            ) : null}
          </>
        }
        aside={
          <div className="grid gap-3">
            <PageStat
              tone="dark"
              label={locale === "zh" ? "已发布案例" : "Published cases"}
              value={snapshot.publishedCount}
              hint={locale === "zh" ? "公开社区可浏览" : "visible to the community"}
            />
            <PageStat
              tone="dark"
              label={locale === "zh" ? "待审核提交" : "Pending review"}
              value={snapshot.pendingReviewCount}
              hint={locale === "zh" ? "等待管理员判断" : "awaiting admin decisions"}
            />
            <PageStat
              tone="dark"
              label={locale === "zh" ? "预览待确认" : "Preview ready"}
              value={snapshot.previewReadyCount}
              hint={locale === "zh" ? "等待 guest 正式提交" : "waiting for guest confirmation"}
            />
          </div>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)] xl:items-start">
        <SurfaceCard className="grid gap-5">
          <SectionHeading
            title={locale === "zh" ? "技能案例库" : "Public skills"}
            description={
              locale === "zh"
                ? "首页主区域按 skill 聚合展示公开内容。点进详情页后可以看到该 skill 下的具体公开案例。"
                : "The main home column groups public content by skill. Open a skill to inspect its published case pages."
            }
            action={
              <Link href="/skills" className={actionButtonClass("secondary")}>
                {locale === "zh" ? "查看全部技能" : "View all skills"}
              </Link>
            }
          />
          <div className="grid gap-4 xl:grid-cols-2">
          {skills.map((item) => {
            return (
              <Link
                key={item.skillId}
                href={`/skills/${encodeURIComponent(item.skillId)}`}
                className="group grid gap-4 rounded-[1.55rem] border border-black/6 bg-[linear-gradient(180deg,_rgba(248,250,252,0.9),_rgba(255,255,255,0.96))] p-5 transition hover:-translate-y-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
                      {locale === "zh" ? "按技能聚合" : "skill grouped"}
                    </span>
                    {item.ordinal ? (
                      <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                        #{item.ordinal}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                      {item.ownerLabel}
                    </span>
                  </div>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                    {item.caseCount} {locale === "zh" ? "案例" : "cases"}
                  </span>
                </div>
                <h3 className="text-xl font-semibold tracking-[-0.04em] transition group-hover:text-slate-950">
                  {item.skillLabel}
                </h3>
                <p className="text-sm text-slate-500">{item.skillId}</p>
                <p className="text-sm leading-7 text-slate-600">{item.representativeSummary || "-"}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <InsetCard tone="white">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {locale === "zh" ? "主要风险" : "Primary risk"}
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-800">
                      {item.primaryHarmType}
                    </div>
                  </InsetCard>
                  <InsetCard tone="white">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {locale === "zh" ? "Findings" : "Findings"}
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-800">
                      {item.findingCount}
                    </div>
                  </InsetCard>
                  <InsetCard tone="white">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {locale === "zh" ? "模型数" : "Models"}
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-800">
                      {item.modelCount}
                    </div>
                  </InsetCard>
                </div>
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  {item.harmTypes.slice(0, 4).map((label) => (
                    <span key={label} className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                      {label}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
          {!skills.length ? (
            <EmptyState
              className="xl:col-span-2"
              title={locale === "zh" ? "还没有已发布的技能案例" : "No public skills yet"}
              body={
                locale === "zh"
                  ? "等管理员审核并发布后，这里会出现可公开浏览的技能案例聚合页。"
                  : "Published skills will appear here after admin review."
              }
            />
          ) : null}
          </div>
        </SurfaceCard>

        <HomeActionRail
          locale={locale}
          previewReadyCount={snapshot.previewReadyCount}
          pendingReviewCount={snapshot.pendingReviewCount}
          isAdmin={viewer?.role === "admin"}
        />
      </section>
    </div>
  );
}
