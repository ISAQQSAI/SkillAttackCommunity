"use client";

import Link from "next/link";
import { signIn, signOut } from "next-auth/react";

import type { Viewer } from "@/lib/community";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getDictionary, translateBackendMode, translateRole, type Locale } from "@/lib/i18n";

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
  const nav = [
    { href: "/", label: dict.shell.nav.home },
    { href: "/showcase", label: dict.shell.nav.showcase },
    { href: "/findings", label: dict.shell.nav.findings },
    { href: "/leaderboards", label: dict.shell.nav.leaderboards },
    { href: "/datasets", label: dict.shell.nav.datasets },
    { href: "/models", label: dict.shell.nav.models },
    { href: "/submit", label: dict.shell.nav.submit },
    ...(viewer ? [{ href: "/reports", label: dict.shell.nav.reports }] : []),
    ...(viewer && (viewer.role === "reviewer" || viewer.role === "admin")
      ? [{ href: "/review", label: dict.shell.nav.review }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,108,71,0.15),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(0,143,126,0.16),_transparent_24%),linear-gradient(180deg,_#fbf7f1,_#f0e8da)] text-slate-900">
      <header className="border-b border-black/8 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <Link href="/" className="text-2xl font-semibold tracking-tight text-slate-950">
              {brand}
            </Link>
            <p className="max-w-2xl text-sm text-slate-600">
              {dict.shell.tagline}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm transition hover:-translate-y-0.5"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-6 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
            <span className="rounded-full bg-slate-950 px-3 py-1 text-white">{translateBackendMode(backendMode, locale)}</span>
            <span className="rounded-full border border-black/10 bg-white px-3 py-1">{dict.shell.chips.reportFirst}</span>
            <span className="rounded-full border border-black/10 bg-white px-3 py-1">{dict.shell.chips.reviewerVerification}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher locale={locale} />
            {viewer ? (
              <>
                <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm">
                  {viewer.name} · {translateRole(viewer.role, locale)}
                  {viewer.isDemo ? ` · ${dict.shell.demoMode}` : ""}
                </div>
                {viewer.isDemo ? null : (
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5"
                  >
                    {dict.shell.signOut}
                  </button>
                )}
              </>
            ) : githubEnabled ? (
              <button
                type="button"
                onClick={() => signIn("github")}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5"
              >
                {dict.shell.signIn}
              </button>
            ) : (
              <div className="rounded-full border border-dashed border-black/20 px-4 py-2 text-sm text-slate-600">
                {dict.shell.authHint}
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8">{children}</main>
    </div>
  );
}
