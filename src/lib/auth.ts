import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { checkRateLimit } from "./rate-limit";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  // 7-day cap (was NextAuth's 30-day default). The token is re-issued on
  // activity (updateAge, 24h default), so an active user isn't logged out;
  // this bounds how long an abandoned or stolen session stays valid.
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const rateLimitKey = `login:${credentials.email.toLowerCase()}`;
        if (!(await checkRateLimit(rateLimitKey, 5, 5 * 60 * 1000))) {
          throw new Error(
            "لقد تجاوزت الحد المسموح لمحاولات تسجيل الدخول (5 محاولات). انتظر 5 دقائق ثم حاول مرة أخرى، أو استخدم « نسيت كلمة المرور؟ » لإعادة التعيين.",
          );
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) return null;

        // Disabled by an admin (see PATCH /api/users/[id]). An already-issued
        // JWT session stays valid until it expires — this only blocks new
        // logins.
        if (user.disabledAt) {
          throw new Error("تم تعطيل هذا الحساب. تواصل مع إدارة المنصة.");
        }

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.role && token.sub) {
        session.user.role = token.role;
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};
