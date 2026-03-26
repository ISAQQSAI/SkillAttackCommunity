import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { getDictionary } from "@/lib/i18n";
import { getViewer, isGithubAuthEnabled } from "@/lib/server/auth";
import { getLocale } from "@/lib/server/locale";
import { getBackendSummary } from "@/lib/server/store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillAttackCommunity",
  description: "Half-open community for submitted vulnerability reports, reviewer verification, and public-safe case publication.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const viewer = await getViewer();
  const backend = await getBackendSummary();
  const dict = getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppShell
          viewer={viewer}
          backendMode={backend.mode}
          githubEnabled={isGithubAuthEnabled()}
          locale={locale}
          brand={dict.shell.brand}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
