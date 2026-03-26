"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut } from "next-auth/react";

import type { Viewer } from "@/lib/community";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getDictionary, translateRole, type Locale } from "@/lib/i18n";
import { skillAttackLinks } from "@/lib/skillattack-links";

interface AppShellProps {
  children: React.ReactNode;
  viewer: Viewer | null;
  backendMode: string;
  githubEnabled: boolean;
  locale: Locale;
  brand: string;
}

export function AppShell({ children, viewer, backendMode, githubEnabled, locale, brand }: AppShellProps) {
  const dict = getDictionary(locale);
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const nav = [
    { href: "/home", label: dict.shell.nav.home },
    { href: "/skills", label: dict.shell.nav.skills },
    { href: "/submit", label: dict.shell.nav.submit },
    ...(viewer ? [{ href: "/reports", label: dict.shell.nav.reports }] : []),
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,108,71,0.15),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(0,143,126,0.16),_transparent_24%),linear-gradient(180deg,_#fbf7f1,_#f0e8da)] text-slate-900">
      {isLandingPage ? null : (
        <header className="border-b border-black/8 bg-white/80 backdrop-blur">
          <div className="mx-auto grid w-full max-w-7xl gap-3 px-6 py-2.5 lg:grid-cols-[minmax(0,1.35fr)_max-content] lg:items-center">
            <div className="grid grid-cols-[auto_1fr] items-center gap-2.5">
              <Link href="/home" className="text-slate-950">
                <Image
                  src="/skillattack-logo.png"
                  alt="SkillAttack logo"
                  width={112}
                  height={112}
                  className="h-16 w-16 rounded-[1.2rem] border border-black/10 bg-white p-1.5 object-contain shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:h-[4.5rem] sm:w-[4.5rem]"
                />
              </Link>
              <div className="flex min-w-0 flex-col gap-1">
                <Link href="/home" className="text-slate-950">
                  <span className="text-[1.65rem] font-semibold tracking-tight lg:text-[2.05rem]">
                    {brand}
                  </span>
                </Link>
                <p className="max-w-4xl text-[13px] leading-[1.15rem] text-slate-600">
                  {dict.shell.tagline}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 lg:items-end">
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <div className="flex items-center gap-2">
                  {externalLinks.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 transition hover:-translate-y-0.5"
                    >
                      {item.icon}
                    </a>
                  ))}
                </div>
                <LanguageSwitcher locale={locale} />
                {viewer ? (
                  <>
                    <div className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-sm">
                      {viewer.name} · {translateRole(viewer.role, locale)}
                      {viewer.isDemo ? ` · ${dict.shell.demoMode}` : ""}
                    </div>
                    {viewer.isDemo ? null : (
                      <button
                        type="button"
                        onClick={() => signOut()}
                        className="rounded-full bg-slate-950 px-3.5 py-1.5 text-sm font-medium text-white transition hover:-translate-y-0.5"
                      >
                        {dict.shell.signOut}
                      </button>
                    )}
                  </>
                ) : githubEnabled ? (
                  <button
                    type="button"
                    onClick={() => signIn("github")}
                    className="rounded-full bg-slate-950 px-3.5 py-1.5 text-sm font-medium text-white transition hover:-translate-y-0.5"
                  >
                    {dict.shell.signIn}
                  </button>
                ) : (
                  <div className="rounded-full border border-dashed border-black/20 px-3.5 py-1.5 text-sm text-slate-600">
                    {dict.shell.authHint}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-[14px] transition hover:-translate-y-0.5"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </header>
      )}
      <main className={`mx-auto flex w-full max-w-7xl flex-1 flex-col ${isLandingPage ? "px-0 py-0" : "px-6 py-8"}`}>
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
