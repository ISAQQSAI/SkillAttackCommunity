"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import type { Viewer } from "@/lib/community";
import { LanguageSwitcher } from "@/components/language-switcher";
import { actionButtonClass } from "@/components/page-chrome";
import { getDictionary, type Locale } from "@/lib/i18n";
import { skillAttackLinks } from "@/lib/skillattack-links";

interface AppShellProps {
  children: React.ReactNode;
  viewer: Viewer | null;
  locale: Locale;
  brand: string;
}

export function AppShell({ children, viewer, locale, brand }: AppShellProps) {
  const dict = getDictionary(locale);
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const isReviewArea = pathname === "/review" || pathname.startsWith("/review/");
  const nav = [
    { href: "/home", label: dict.shell.nav.home },
    { href: "/vulnerabilities", label: dict.shell.nav.skills },
    { href: "/submit", label: dict.shell.nav.submit },
    { href: "/reports", label: dict.shell.nav.reports },
    ...(isReviewArea && viewer && viewer.role === "admin"
      ? [{ href: "/review", label: dict.shell.nav.review }]
      : []),
  ];
  const externalLinks = [
    {
      href: skillAttackLinks.arxivUrl,
      label: locale === "zh" ? "论文" : "Paper",
      icon: <PaperIcon />,
    },
    {
      href: skillAttackLinks.repoUrl,
      label: locale === "zh" ? "GitHub 仓库" : "GitHub repository",
      icon: <GitHubIcon />,
    },
  ];
  const footerLinks = [
    {
      href: "https://beian.miit.gov.cn/",
      label: "京ICP备2026018243号",
      external: true,
    },
    { href: skillAttackLinks.arxivUrl, label: "Paper", external: true },
    { href: skillAttackLinks.repoUrl, label: "GitHub", external: true },
    {
      href: "mailto:uanduan5@gmail.com",
      label: "Email: uanduan5@gmail.com",
      external: true,
    },
  ];

  function isActive(href: string) {
    if (
      href === "/vulnerabilities" &&
      (pathname === "/findings" ||
        pathname.startsWith("/findings/") ||
        pathname === "/vulnerabilities" ||
        pathname.startsWith("/vulnerabilities/") ||
        pathname === "/skills" ||
        pathname.startsWith("/skills/"))
    ) {
      return true;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eaf1f8] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(29,78,216,0.12),transparent_32%),radial-gradient(circle_at_85%_12%,rgba(14,116,144,0.08),transparent_22%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:28px_28px] opacity-45" />
      {isLandingPage ? null : (
        <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-[rgba(242,247,253,0.9)] backdrop-blur-xl">
          <div className="mx-auto grid w-full max-w-7xl gap-3 px-5 py-4 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_max-content] lg:items-center lg:py-5">
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <Link href="/home" className="text-slate-950">
                <Image
                  src="/skillatlas-logo-5-2-6.svg"
                  alt={locale === "zh" ? "SkillAtlas 标志" : "SkillAtlas logo"}
                  width={128}
                  height={128}
                  unoptimized
                  className="h-24 w-24 rounded-none border border-slate-200/80 p-0.5 object-contain shadow-[0_14px_32px_rgba(15,23,42,0.05)] sm:h-28 sm:w-28"
                />
              </Link>
              <div className="flex min-w-0 flex-col gap-1">
                <Link href="/home" className="text-slate-950">
                  <span className="text-[2.1rem] font-semibold tracking-[-0.06em] lg:text-[2.9rem]">
                    {brand}
                  </span>
                </Link>
                <p className="max-w-5xl text-[15px] leading-6 text-slate-600 lg:text-[16px]">
                  {dict.shell.tagline}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <div className="flex items-center gap-2 rounded-none border border-slate-200 bg-[rgba(247,251,255,0.88)] px-2 py-2 shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
                  {externalLinks.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      className="flex h-9 w-9 items-center justify-center rounded-none border border-slate-200 bg-white text-slate-600 transition hover:border-[#11284e] hover:bg-[#11284e] hover:text-white"
                    >
                      {item.icon}
                    </a>
                  ))}
                </div>
                <LanguageSwitcher locale={locale} shape="square" />
                {isReviewArea && viewer ? (
                  <>
                    <div className="rounded-none border border-slate-200 bg-[rgba(247,251,255,0.9)] px-3.5 py-1.5 text-sm shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
                      {locale === "zh" ? "审核后台" : "Review console"}
                      {viewer.isLocal ? ` · ${locale === "zh" ? "仅本地可用" : "local only"}` : ""}
                    </div>
                    {viewer.isDemo || viewer.isLocal ? null : (
                      <button
                        type="button"
                        onClick={() => signOut()}
                        className={actionButtonClass("primary")}
                      >
                        {dict.shell.signOut}
                      </button>
                    )}
                  </>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 rounded-none border border-slate-200 bg-[rgba(247,251,255,0.92)] p-2 shadow-[0_14px_32px_rgba(15,23,42,0.05)] lg:justify-end">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-none px-3.5 py-2 text-[14px] font-medium transition ${
                      isActive(item.href)
                        ? "border border-[#11284e] bg-[#11284e] text-white !text-white hover:!text-white visited:!text-white [&_*]:!text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-[#f3f7fd]"
                    }`}
                    style={isActive(item.href) ? { color: "#ffffff" } : undefined}
                  >
                    <span
                      className={isActive(item.href) ? "!text-white" : undefined}
                      style={isActive(item.href) ? { color: "#ffffff" } : undefined}
                    >
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </header>
      )}
      <main className={`relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col ${isLandingPage ? "px-0 py-0" : "px-5 py-8 sm:px-6 lg:py-10"}`}>
        {children}
      </main>
      <footer className="relative z-10 mt-auto border-t border-slate-200/90 bg-[rgba(242,247,253,0.9)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-5 py-5 text-sm text-slate-600 sm:px-6">
          <span className="text-center font-medium tracking-[0.08em] text-slate-700">
            SkillAtlas © 2026
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center sm:gap-x-12">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:gap-x-5">
              {footerLinks.map((item, index) => (
                <span key={item.label} className="flex items-center gap-4">
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="transition hover:text-[#11284e]"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link href={item.href} className="transition hover:text-[#11284e]">
                      {item.label}
                    </Link>
                  )}
                  {index < footerLinks.length - 1 ? <span className="text-slate-300">·</span> : null}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M12 .5A12 12 0 0 0 8.2 23.9c.6.1.8-.2.8-.6v-2.1c-3.4.8-4.1-1.4-4.1-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.9 1.3 3.6 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.4-5.5-6A4.8 4.8 0 0 1 6 8.7a4.5 4.5 0 0 1 .1-3.2s1-.3 3.3 1.2a11.2 11.2 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2a4.5 4.5 0 0 1 .1 3.2 4.8 4.8 0 0 1 1.3 3.3c0 4.7-2.8 5.7-5.5 6 .4.4.8 1 .8 2v3c0 .4.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

function PaperIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current" fill="none" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3.5h6l4 4V20.5H8a2.5 2.5 0 0 1-2.5-2.5V6A2.5 2.5 0 0 1 8 3.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3.5v4h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 15.5h6M9 19h4" />
    </svg>
  );
}
