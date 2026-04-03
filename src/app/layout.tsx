import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/server/locale";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillAtlas",
  description:
    "Attack Trace Library for Agent Skills — Focusing on decision paths of unsafe behaviors executed by agents and public security cases",
  icons: {
    icon: "/skillatlas-logo-5-2-6.svg",
    shortcut: "/skillatlas-logo-5-2-6.svg",
    apple: "/skillatlas-logo-5-2-6.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppShell
          viewer={null}
          locale={locale}
          brand={dict.shell.brand}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
