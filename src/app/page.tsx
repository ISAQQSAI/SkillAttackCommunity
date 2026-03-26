import Image from "next/image";
import Link from "next/link";

import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/server/locale";
import { getHomeSnapshot } from "@/lib/server/store";
import { skillAttackLinks } from "@/lib/skillattack-links";
import { getSkillVaultSummary } from "@/lib/skill-vault";

export default async function LandingPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const snapshot = await getHomeSnapshot();
  const vaultSummary = getSkillVaultSummary();
  const payload = (snapshot?.payload || {}) as {
    publishedCount?: number;
    reporterCount?: number;
  };

  const landingCopy = {
    badge: locale === "zh" ? "SkillAttack 社区" : "SkillAttack community",
    title: "SkillAttackCommunity",
    slogan:
      locale === "zh"
        ? "提交、审核并发布 Agent Skill 漏洞报告。"
        : "Submit, review, and publish vulnerability reports for agent skills.",
    body:
      locale === "zh"
        ? "一个以证据为中心的半开放社区，沉淀漏洞报告、复现步骤、关键证据与公开案例。"
        : "A half-open, evidence-first community for collecting findings, reproduction steps, smoking guns, and public-safe case pages.",
    startNowCta: "Start Now",
    github: locale === "zh" ? "GitHub" : "GitHub",
    showcase: locale === "zh" ? "展示" : "Showcase",
    paper: locale === "zh" ? "Paper" : "Paper",
    trackedSkills: locale === "zh" ? "已追踪 skills" : "Tracked skills",
    published: locale === "zh" ? "已发布案例" : "Published cases",
    reporters: locale === "zh" ? "提交者" : "Reporters",
  };

  const externalLinks = [
    {
      href: skillAttackLinks.repoUrl,
      label: landingCopy.github,
      icon: <GitHubIcon />,
    },
    {
      href: skillAttackLinks.showcaseUrl,
      label: landingCopy.showcase,
      icon: <ShowcaseIcon />,
    },
    {
      href: skillAttackLinks.arxivUrl,
      label: landingCopy.paper,
      icon: <PaperIcon />,
    },
  ];

  return (
    <section className="landing-hero relative isolate [margin-left:calc(50%-50vw)] [margin-right:calc(50%-50vw)] overflow-hidden text-white shadow-[0_40px_140px_rgba(15,23,42,0.28)]">
      <div className="landing-aurora landing-aurora-a" />
      <div className="landing-aurora landing-aurora-b" />
      <div className="landing-aurora landing-aurora-c" />
      <div className="landing-grid" />
      <div className="landing-wave landing-wave-a" />
      <div className="landing-wave landing-wave-b" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_rgba(255,255,255,0.04),_transparent_24%,_rgba(255,255,255,0.02))]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent,_rgba(4,10,21,0.14)_76%,_rgba(4,10,21,0.34)_100%)]" />

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col justify-between px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-11">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="grid max-w-5xl justify-items-center gap-5 sm:gap-6">
            <div className="w-fit rounded-full border border-white/14 bg-white/8 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/74 backdrop-blur">
              {landingCopy.badge}
            </div>

            <div className="landing-logo-shell rounded-[1.9rem] border border-slate-200/80 bg-white p-3.5 shadow-[0_20px_60px_rgba(15,23,42,0.24)]">
              <Image
                src="/skillattack-logo.png"
                alt="SkillAttack logo"
                width={208}
                height={208}
                className="h-28 w-28 object-contain sm:h-32 sm:w-32 lg:h-40 lg:w-40"
                priority
              />
            </div>

            <div className="grid justify-items-center gap-3">
              <h1 className="landing-title max-w-6xl text-5xl font-semibold tracking-[-0.075em] text-white sm:text-6xl lg:text-[5.25rem]">
                {landingCopy.title}
              </h1>
              <p className="max-w-3xl text-xl leading-8 text-white/84 sm:text-2xl">{landingCopy.slogan}</p>
            </div>

            <p className="max-w-[44rem] text-base leading-7 text-white/68 sm:text-lg">
              {landingCopy.body}
            </p>

            <div className="flex flex-col items-center gap-4 sm:gap-[1.15rem]">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {externalLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="landing-link-chip inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-medium text-white/78 backdrop-blur transition hover:-translate-y-0.5 hover:text-white"
                  >
                    <span className="landing-link-icon flex h-5 w-5 items-center justify-center text-white/72">{item.icon}</span>
                    <span>{item.label}</span>
                  </a>
                ))}
              </div>

              <Link
                href="/home"
                className="landing-primary-button inline-flex items-center justify-center rounded-full bg-white px-10 py-[1.02rem] transition hover:-translate-y-0.5 sm:px-12 sm:py-[1.12rem]"
              >
                <span className="relative z-10 text-lg font-semibold text-slate-950 sm:text-[1.35rem]">
                  {landingCopy.startNowCta}
                </span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-center pb-1 lg:mt-6">
          <div className="landing-stats-line flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-white/42 sm:text-[15px]">
            <span>
              {vaultSummary.uniqueSkillCount} {landingCopy.trackedSkills}
            </span>
            <span className="text-white/22">·</span>
            <span>
              {payload.publishedCount || 0} {landingCopy.published}
            </span>
            <span className="text-white/22">·</span>
            <span>
              {payload.reporterCount || 0} {landingCopy.reporters}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M12 .5A12 12 0 0 0 8.2 23.9c.6.1.8-.2.8-.6v-2.1c-3.4.8-4.1-1.4-4.1-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.9 1.3 3.6 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.4-5.5-6A4.8 4.8 0 0 1 6 8.7a4.5 4.5 0 0 1 .1-3.2s1-.3 3.3 1.2a11.2 11.2 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2a4.5 4.5 0 0 1 .1 3.2 4.8 4.8 0 0 1 1.3 3.3c0 4.7-2.8 5.7-5.5 6 .4.4.8 1 .8 2v3c0 .4.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

function ShowcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current" fill="none" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="12" rx="2.5" />
      <path d="M8 19.5h8" />
      <path d="M12 16.5v3" />
      <path d="m8 9 2.5 2.5L16 8" />
    </svg>
  );
}

function PaperIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current" fill="none" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 3.5h7l4 4v13H7z" />
      <path d="M14 3.5v4h4" />
      <path d="M9.5 12h5" />
      <path d="M9.5 16h5" />
    </svg>
  );
}
