import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { tenant: true },
        });

        if (!user) return null;

        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!passwordValid) return null;

        // REGRA 7 — Bloquear inadimplentes no login
        if (user.role !== "SUPER_ADMIN" && user.tenant && !user.tenant.isActive) {
          throw new Error("Conta bloqueada. Entre em contato com o suporte.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.tenantId = (user as { tenantId?: string }).tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string | undefined;
      }
      return session;
    },
  },
};

// Adicione isso para o TS reconhecer as novas propriedades no session.user
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      tenantId?: string;
      name?: string | null;
      email?: string | null;
    }
  }

  interface User {
    role: string;
    tenantId?: string | null;
  }
}