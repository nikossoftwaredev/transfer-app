import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      id: "driver-login",
      name: "Driver Login",
      credentials: {
        phone: { label: "Phone", type: "text" },
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.pin) return null;

        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone },
          include: { driver: true },
        });

        if (!user || user.role !== "driver" || !user.pinHash) return null;

        const valid = await compare(credentials.pin, user.pinHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          orgId: user.orgId,
          driverId: user.driver?.id ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        try {
          await prisma.user.upsert({
            where: { email: profile.email },
            update: {
              name: profile.name || user.name || "Unknown",
              image: user.image ?? undefined,
            },
            create: {
              email: profile.email,
              name: profile.name || user.name || "Unknown",
              role: "client",
              image: user.image ?? undefined,
              emailVerified: (
                profile as unknown as { email_verified?: boolean }
              ).email_verified
                ? new Date()
                : null,
            },
          });
          return true;
        } catch (error) {
          console.error("Error saving user to database:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // On initial sign-in, populate token with user data
      if (user && "role" in user) {
        token.id = user.id;
        token.role = user.role as string;
        token.orgId = (user as unknown as { orgId: string | null }).orgId;
        token.driverId = (user as unknown as { driverId: string | null })
          .driverId;
        return token;
      }

      // Google OAuth sign-in: look up user from DB
      if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          include: { driver: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.orgId = dbUser.orgId;
          token.driverId = dbUser.driver?.id ?? null;
        }
      }

      // On subsequent requests, refresh role if not yet set
      if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          include: { driver: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.orgId = dbUser.orgId;
          token.driverId = dbUser.driver?.id ?? null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.orgId = token.orgId;
      session.user.driverId = token.driverId;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
