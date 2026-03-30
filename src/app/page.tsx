import Image from "next/image";
import Link from "next/link";

import { getLocale } from "@/lib/server/locale";
import { getCommunitySnapshot } from "@/lib/server/report-submissions";
import { skillAttackLinks } from "@/lib/skillattack-links";

export default async function LandingPage() {
  const locale = await getLocale();
  const snapshot = await getCommunitySnapshot();

  const landingCopy = {
    badge: locale === "zh" ? "SkillAtlas 安全案例社区" : "SkillAtlas public-safe case community",
    title: "SkillAtlas",
    slogan:
      locale === "zh"
        ? "Guest 上传，管理员审核，社区展示安全版报告。"
        : "Guest upload, admin review, public-safe case publishing.",
    body:
      locale === "zh"
        ? "一个面向 Agent/Skill 安全的社区工作流：guest 上传 report bundle，服务端先解析并脱敏，管理员审核通过后再公开展示。"
        : "A community workflow for agent and skill safety: guests upload report bundles, the server parses and redacts them, and admins decide which public-safe cases to publish.",
    startNowCta: locale === "zh" ? "进入社区" : "Enter Community",
    github: locale === "zh" ? "GitHub" : "GitHub",
    showcase: locale === "zh" ? "展示" : "Showcase",
    paper: locale === "zh" ? "Paper" : "Paper",
    trackedSkills: locale === "zh" ? "预览待确认" : "Preview ready",
    published: locale === "zh" ? "已发布案例" : "Published cases",
    reporters: locale === "zh" ? "待审核提交" : "Pending review",
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
                src="/skillattack-logo-1.png"
                alt="SkillAtlas logo"
                width={208}
                height={208}
                unoptimized
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

        <div className="mt-8 flex justify-center pb-1 lg:mt-10">
          <div className="grid w-full max-w-4xl gap-3 sm:grid-cols-3">
            {[
              { label: landingCopy.trackedSkills, value: snapshot.previewReadyCount },
              { label: landingCopy.published, value: snapshot.publishedCount },
              { label: landingCopy.reporters, value: snapshot.pendingReviewCount },
            ].map((item) => (
              <div
                key={item.label}
                className="landing-stat-card rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-4 text-center backdrop-blur-sm"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/48">
                  {item.label}
                </div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white">
                  {item.value}
                </div>
              </div>
            ))}
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
