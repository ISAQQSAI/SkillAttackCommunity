import { getServerSession, type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

import type { UserRole, Viewer } from "@/lib/community";

function splitLogins(value?: string): string[] {
  return (value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

const adminLogins = splitLogins(process.env.ADMIN_GITHUB_LOGINS);
const reviewerLogins = splitLogins(process.env.REVIEWER_GITHUB_LOGINS);

const githubEnabled = Boolean(
  process.env.GITHUB_ID && process.env.GITHUB_SECRET && process.env.NEXTAUTH_SECRET
);

function resolveRole(login?: string | null): UserRole {
  const normalized = (login || "").toLowerCase();
  if (adminLogins.includes(normalized)) {
    return "admin";
  }
  if (reviewerLogins.includes(normalized)) {
    return "reviewer";
  }
  return "reporter";
}

export const authOptions: NextAuthOptions = {
  providers: githubEnabled
    ? [
        GitHubProvider({
          clientId: process.env.GITHUB_ID!,
          clientSecret: process.env.GITHUB_SECRET!,
        }),
      ]
    : [],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, profile }) {
      const login = (profile as { login?: string } | undefined)?.login ?? token.login ?? null;
      token.login = login;
      token.role = resolveRole(login);
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.sub || "anonymous",
        role: (token.role as UserRole) || "reporter",
        login: token.login || null,
        name: session.user?.name || null,
        email: session.user?.email || null,
        image: session.user?.image || null,
      };
      return session;
    },
  },
  pages: {
    signIn: "/api/auth/signin",
  },
};

export async function getViewer(): Promise<Viewer | null> {
  if (githubEnabled) {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return {
        id: session.user.id,
        name: session.user.name || session.user.login || "GitHub user",
        role: session.user.role,
        login: session.user.login || undefined,
        email: session.user.email || undefined,
        image: session.user.image || undefined,
      };
    }
  }

  if (process.env.DEMO_AUTH !== "false") {
    return {
      id: "demo-admin",
      name: process.env.DEMO_NAME || "Demo Admin",
      role: (process.env.DEMO_ROLE as UserRole) || "admin",
      login: process.env.DEMO_LOGIN || "demo-admin",
      isDemo: true,
    };
  }

  return null;
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) {
    throw new Error("Authentication required.");
  }
  return viewer;
}

export async function requireRole(roles: UserRole[]): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!roles.includes(viewer.role)) {
    throw new Error("Insufficient permissions.");
  }
  return viewer;
}

export function isGithubAuthEnabled(): boolean {
  return githubEnabled;
}
