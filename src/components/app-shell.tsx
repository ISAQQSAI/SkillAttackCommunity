"use client";

import Link from "next/link";
import { signIn, signOut } from "next-auth/react";

import type { Viewer } from "@/lib/community";

interface AppShellProps {
  children: React.ReactNode;
  viewer: Viewer | null;
  backendMode: string;
  githubEnabled: boolean;
}

export function AppShell({ children, viewer, backendMode, githubEnabled }: AppShellProps) {
  const nav = [
    { href: "/", label: "Home" },
    { href: "/findings", label: "Findings" },
    { href: "/leaderboards", label: "Leaderboards" },
    { href: "/datasets", label: "Datasets" },
    { href: "/models", label: "Models" },
    { href: "/submit", label: "Submit" },
    ...(viewer ? [{ href: "/reports", label: "My Reports" }] : []),
    ...(viewer && (viewer.role === "reviewer" || viewer.role === "admin")
      ? [{ href: "/review", label: "Review" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,108,71,0.15),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(0,143,126,0.16),_transparent_24%),linear-gradient(180deg,_#fbf7f1,_#f0e8da)] text-slate-900">
      <header className="border-b border-black/8 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <Link href="/" className="text-2xl font-semibold tracking-tight text-slate-950">
              SkillAttackCommunity
            </Link>
            <p className="max-w-2xl text-sm text-slate-600">
              Half-open community for submitted vulnerability reports, reviewer verification, and public-safe case publication.
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
            <span className="rounded-full bg-slate-950 px-3 py-1 text-white">{backendMode}</span>
            <span className="rounded-full border border-black/10 bg-white px-3 py-1">report-first workflow</span>
            <span className="rounded-full border border-black/10 bg-white px-3 py-1">reviewer verification</span>
          </div>
          <div className="flex items-center gap-3">
            {viewer ? (
              <>
                <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm">
                  {viewer.name} · {viewer.role}
                  {viewer.isDemo ? " · demo mode" : ""}
                </div>
                {viewer.isDemo ? null : (
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5"
                  >
                    Sign out
                  </button>
                )}
              </>
            ) : githubEnabled ? (
              <button
                type="button"
                onClick={() => signIn("github")}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5"
              >
                Sign in with GitHub
              </button>
            ) : (
              <div className="rounded-full border border-dashed border-black/20 px-4 py-2 text-sm text-slate-600">
                Configure GitHub OAuth or use demo auth
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8">{children}</main>
    </div>
  );
}
