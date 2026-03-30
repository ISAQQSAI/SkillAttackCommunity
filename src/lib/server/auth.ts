import { getServerSession, type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

import type { Viewer } from "@/lib/community";
import { isLocalRequest } from "@/lib/server/local-access";

function splitLogins(value?: string): string[] {
  return (value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

const adminLogins = splitLogins(process.env.ADMIN_GITHUB_LOGINS);
const githubEnabled = Boolean(
  process.env.GITHUB_ID && process.env.GITHUB_SECRET && process.env.NEXTAUTH_SECRET
);

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
    async signIn({ profile }) {
      const login = ((profile as { login?: string } | undefined)?.login || "").toLowerCase();
      return adminLogins.includes(login);
    },
    async jwt({ token, profile }) {
      const login = (profile as { login?: string } | undefined)?.login ?? token.login ?? null;
      token.login = login;
      token.role = "admin";
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.sub || "anonymous",
        role: "admin",
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
  const localRequest = await isLocalRequest();
  if (!localRequest) {
    return null;
  }

  if (githubEnabled) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role === "admin") {
      return {
        id: session.user.id,
        name: session.user.name || session.user.login || "GitHub user",
        role: "admin",
        login: session.user.login || undefined,
        email: session.user.email || undefined,
        image: session.user.image || undefined,
      };
    }
  }

  if (process.env.LOCAL_ADMIN_ENABLED !== "false") {
    return {
      id: "local-admin",
      name: process.env.LOCAL_ADMIN_NAME || "Local Admin",
      role: "admin",
      login: process.env.LOCAL_ADMIN_LOGIN || "local-admin",
      isLocal: true,
    };
  }

  return null;
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) {
    throw new Error("Admin authentication required.");
  }
  return viewer;
}

export async function requireRole(roles: Array<Viewer["role"]>): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!roles.includes(viewer.role)) {
    throw new Error("Insufficient permissions.");
  }
  return viewer;
}
