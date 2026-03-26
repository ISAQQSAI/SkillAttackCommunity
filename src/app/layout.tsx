import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { getViewer, isGithubAuthEnabled } from "@/lib/server/auth";
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
  const viewer = await getViewer();
  const backend = await getBackendSummary();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppShell viewer={viewer} backendMode={backend.mode} githubEnabled={isGithubAuthEnabled()}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
