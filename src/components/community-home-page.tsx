import Link from "next/link";

import { getDictionary, translateVerificationBadge } from "@/lib/i18n";
import { getViewer } from "@/lib/server/auth";
import { getLocale } from "@/lib/server/locale";
import { getBackendSummary, getHomeSnapshot, listPublicFindingViews } from "@/lib/server/store";
import { getSkillVaultCopy, getSkillVaultSummary } from "@/lib/skill-vault";

export async function CommunityHomePage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const viewer = await getViewer();
  const vaultCopy = getSkillVaultCopy(locale);
  const vaultSummary = await getSkillVaultSummary();
  const snapshot = await getHomeSnapshot();
  const backend = await getBackendSummary();
  const latest = await listPublicFindingViews();
  const payload = (snapshot?.payload || {}) as {
    publishedCount?: number;
    reporterCount?: number;
  };
  const skillVaultCard = {
    title: vaultCopy.pageName,
    body:
      locale === "zh"
        ? "按 skill 浏览 Hot100 真实危害切片，查看每个 skill 的报告数量、主要风险类型和代表性证据。"
        : "Browse the Hot100 real-harm slice by skill, including report count, main risk types, and representative evidence.",
    stats:
      locale === "zh"
        ? [
            `${vaultSummary.uniqueSkillCount} 个 skills`,
            `${vaultSummary.reportCount} 份 reports`,
            `${vaultSummary.harmTypeCount} 类 risks`,
          ]
        : [
            `${vaultSummary.uniqueSkillCount} skills`,
            `${vaultSummary.reportCount} reports`,
            `${vaultSummary.harmTypeCount} risk types`,
          ],
    href: "/skills",
  };

  const submitCard = {
    title: dict.shell.nav.submit,
    body:
      locale === "zh"
        ? "提交已经审计好的漏洞报告、复现步骤和证据文件，由社区审核后发布。"
        : "Submit already-audited vulnerability reports, reproduction steps, and evidence bundles for review.",
    href: "/submit",
  };

  const reportsCard = viewer
    ? {
        title: dict.shell.nav.reports,
        body:
          locale === "zh"
            ? "查看你自己的草稿、审核状态、发布情况和 artifact 解析结果。"
            : "Track your drafts, review status, publication state, and parsed artifact results.",
        href: "/reports",
      }
    : {
        title: dict.shell.nav.reports,
        body:
          locale === "zh"
            ? "登录后查看你提交过的报告、审核反馈与发布状态。"
            : "Sign in to track your submitted reports, reviewer feedback, and publication status.",
        href: "/submit",
      };

  return (
    <div className="grid gap-8">
      <section className="overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(203,255,122,0.18),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(255,104,71,0.22),_transparent_24%),linear-gradient(135deg,_#0f172a,_#1e293b_55%,_#1d4d4f)] p-8 text-white shadow-[0_32px_120px_rgba(15,23,42,0.28)]">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)] lg:items-stretch">
          <div className="grid gap-5">
            <div className="w-fit rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/75">
              {dict.home.heroBadge}
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.08em]">{dict.home.heroTitle}</h1>
            <p className="max-w-3xl text-lg leading-8 text-white/78">{dict.home.heroBody}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/skills"
                className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
              >
                {vaultCopy.pageName}
              </Link>
              <Link
                href="/submit"
                className="rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                {dict.home.submit}
              </Link>
              {viewer?.role === "admin" ? (
                <Link
                  href="/review"
                  className="rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                >
                  {dict.home.review}
                </Link>
              ) : null}
            </div>
          </div>
          <div className="flex h-full flex-col justify-end rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 text-sm text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold tracking-[0.08em] text-white/92">{dict.home.backend}</span>
              <span className="rounded-full bg-white/12 px-3 py-1 text-sm font-semibold text-white/92">{backend.mode}</span>
            </div>
            <div className="mt-4 grid gap-2.5">
              <div className="flex items-center justify-between rounded-[1.15rem] border border-white/8 bg-white/8 px-4 py-4">
                <span className="text-sm font-medium uppercase tracking-[0.14em] text-white/78">{dict.home.published}</span>
                <span className="text-[2.2rem] font-semibold leading-none text-white">{payload.publishedCount || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-[1.15rem] border border-white/8 bg-white/8 px-4 py-4">
                <span className="text-sm font-medium uppercase tracking-[0.14em] text-white/78">{vaultCopy.stats.trackedSkills}</span>
                <span className="text-[2.2rem] font-semibold leading-none text-white">{vaultSummary.uniqueSkillCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-[1.15rem] border border-white/8 bg-white/8 px-4 py-4">
                <span className="text-sm font-medium uppercase tracking-[0.14em] text-white/78">{dict.home.reporters}</span>
                <span className="text-[2.2rem] font-semibold leading-none text-white">{payload.reporterCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.8fr)] lg:items-stretch">
        <Link
          href={skillVaultCard.href}
          className="group relative overflow-hidden rounded-[1.9rem] border border-black/10 bg-[radial-gradient(circle_at_top_left,rgba(203,255,122,0.16),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
        >
          <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-emerald-100/60 blur-3xl" />
          <div className="pointer-events-none absolute left-0 top-0 h-1 w-full bg-[linear-gradient(90deg,rgba(149,255,76,0.9),rgba(27,163,156,0.55),transparent)]" />
          <div className="grid h-full gap-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[2rem] font-semibold tracking-[-0.04em]">{skillVaultCard.title}</h2>
                <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">{skillVaultCard.body}</p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-700 shadow-[0_8px_24px_rgba(16,185,129,0.08)]">
                Primary
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              {vaultSummary.datasetCount ? (
                <span className="rounded-full border border-black/8 bg-white/75 px-3 py-1">
                  {vaultSummary.datasetCount} {locale === "zh" ? "个数据集" : "datasets"}
                </span>
              ) : null}
              {vaultSummary.modelCount ? (
                <span className="rounded-full border border-black/8 bg-white/75 px-3 py-1">
                  {vaultSummary.modelCount} {locale === "zh" ? "个模型" : "models"}
                </span>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {skillVaultCard.stats.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.25rem] border border-black/8 bg-white/82 px-4 py-4 text-sm font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm leading-7 text-slate-600">
                {locale === "zh"
                  ? "从 skill 视角查看漏洞类型、成功 lane、轮次与证据入口。"
                  : "Inspect vulnerability types, successful lanes, rounds, and evidence from the skill view."}
              </div>
              <div className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-900">
                <span>{locale === "zh" ? "进入 Skill Vault" : "Open Skill Vault"}</span>
                <span className="transition group-hover:translate-x-1">→</span>
              </div>
            </div>
          </div>
        </Link>

        <div className="grid gap-4">
          <Link
            href={submitCard.href}
            className="rounded-[1.8rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
          >
            <h2 className="text-xl font-semibold">{submitCard.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{submitCard.body}</p>
          </Link>
          <Link
            href={reportsCard.href}
            className="rounded-[1.8rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
          >
            <h2 className="text-xl font-semibold">{reportsCard.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{reportsCard.body}</p>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{dict.home.latestPublishedTitle}</h2>
            <p className="text-sm text-slate-600">{dict.home.latestPublishedBody}</p>
          </div>
          <Link href="/skills" className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline">
            {locale === "zh" ? "进入 Skill Vault" : "Open Skill Vault"}
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {latest.slice(0, 6).map((item) => (
            <Link
              key={item.published.id}
              href={`/findings/${item.published.slug}`}
              className="grid gap-3 rounded-[1.5rem] border border-black/8 bg-slate-50 p-5 transition hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm uppercase tracking-[0.18em] text-slate-500">{item.finding.datasetTag}</div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                  {translateVerificationBadge(item.published.verificationBadge, locale)}
                </div>
              </div>
              <h3 className="text-xl font-semibold">{item.published.publicTitle}</h3>
              <p className="text-sm leading-7 text-slate-600">{item.published.publicSummary}</p>
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                <span className="rounded-full bg-white px-3 py-1">{item.finding.vendor}</span>
                <span className="rounded-full bg-white px-3 py-1">{item.finding.vulnType}</span>
                {item.finding.modelTags.map((model) => (
                  <span key={model} className="rounded-full bg-white px-3 py-1">
                    {model}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
