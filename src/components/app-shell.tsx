"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import type { Viewer } from "@/lib/community";
import { LanguageSwitcher } from "@/components/language-switcher";
import { actionButtonClass } from "@/components/page-chrome";
import { getDictionary, translateRole, type Locale } from "@/lib/i18n";
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
  const nav = [
    { href: "/home", label: dict.shell.nav.home },
    { href: "/skills", label: dict.shell.nav.skills },
    { href: "/submit", label: dict.shell.nav.submit },
    { href: "/reports", label: locale === "zh" ? "查询提交" : "Track submission" },
    ...(viewer && viewer.role === "admin"
      ? [{ href: "/review", label: dict.shell.nav.review }]
      : []),
  ];
  const externalLinks = [
    {
      href: skillAttackLinks.repoUrl,
      label: locale === "zh" ? "GitHub 仓库" : "GitHub repository",
      icon: <GitHubIcon />,
    },
    {
      href: skillAttackLinks.showcaseUrl,
      label: locale === "zh" ? "展示界面" : "Showcase view",
      icon: <ShowcaseIcon />,
    },
    {
      href: skillAttackLinks.arxivUrl,
      label: locale === "zh" ? "arXiv 占位链接" : "arXiv placeholder",
      icon: <ArxivIcon />,
    },
  ];

  function isActive(href: string) {
    if (href === "/skills" && (pathname === "/findings" || pathname.startsWith("/findings/"))) {
      return true;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,108,71,0.16),_transparent_24%),radial-gradient(circle_at_82%_14%,_rgba(0,143,126,0.12),_transparent_18%),radial-gradient(circle_at_bottom_left,_rgba(255,220,160,0.28),_transparent_24%),linear-gradient(180deg,_#f7f1e6,_#efe6d7_48%,_#f7f2ea)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.018)_1px,transparent_1px)] bg-[size:26px_26px] opacity-55" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-48 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-white/30 blur-3xl" />
      {isLandingPage ? null : (
        <header className="sticky top-0 z-40 border-b border-black/6 bg-[rgba(247,241,230,0.74)] backdrop-blur-xl">
          <div className="mx-auto grid w-full max-w-7xl gap-3 px-5 py-4 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_max-content] lg:items-center lg:py-5">
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <Link href="/home" className="text-slate-950">
                <Image
                  src="/skillattack-logo-1.png"
                  alt="SkillAtlas logo"
                  width={112}
                  height={112}
                  unoptimized
                  className="h-20 w-20 rounded-[1.6rem] border border-black/8 bg-white/95 p-1.5 object-contain shadow-[0_14px_36px_rgba(15,23,42,0.1)] sm:h-24 sm:w-24"
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
                <div className="flex items-center gap-2 rounded-full border border-black/8 bg-white/75 px-2 py-2 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                  {externalLinks.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-black/8 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:text-slate-950"
                    >
                      {item.icon}
                    </a>
                  ))}
                </div>
                <LanguageSwitcher locale={locale} />
                {viewer ? (
                  <>
                    <div className="rounded-full border border-black/8 bg-white/80 px-3.5 py-1.5 text-sm shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                      {viewer.name} · {translateRole(viewer.role, locale)}
                      {viewer.isLocal ? ` · ${locale === "zh" ? "仅本地" : "local only"}` : ""}
                      {viewer.isDemo ? ` · ${dict.shell.demoMode}` : ""}
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
              <div className="flex flex-wrap items-center gap-2 rounded-[1.4rem] border border-black/8 bg-white/72 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.05)] lg:justify-end">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-3.5 py-2 text-[14px] font-medium transition ${
                      isActive(item.href)
                        ? "bg-slate-950 text-white !text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)] hover:!text-white visited:!text-white"
                        : "border border-transparent bg-white/78 text-slate-700 hover:-translate-y-0.5 hover:bg-white"
                    }`}
                    style={isActive(item.href) ? { color: "#ffffff" } : undefined}
                  >
                    <span style={isActive(item.href) ? { color: "#ffffff" } : undefined}>
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

function ShowcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current" fill="none" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="12" rx="2.5" />
      <path d="M8 19.5h8" />
      <path d="M12 16.5v3" />
      <path d="m8 9 2.5 2.5L16 8" />
    </svg>
  );
}

function ArxivIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current" fill="none" strokeWidth="1.8" aria-hidden="true">
      <path d="M4.5 18.5 12 5.5l7.5 13" />
      <path d="M8 13h8" />
      <path d="M10 16.5h4" />
    </svg>
  );
}
