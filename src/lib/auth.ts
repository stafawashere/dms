import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
   adapter: PrismaAdapter(prisma),
   providers: [
      Credentials({
         credentials: {
            email: {},
            password: {}
         },
         authorize: async (credentials) => {
            const user = await prisma.user.findUnique({ where: { email: credentials.email as string } });
            if (!user) return null;

            const validated = await bcrypt.compare(credentials.password as string, user.password)
            if (validated) return user;
            return null;
         }
      })
   ],
   session: { strategy: "jwt" },
   callbacks: {
      jwt: async ({ token, user }) => {
         if (user) {
            token.id = user.id;
            token.role = (user as { role: string }).role;
         }
         return token;
      },
      session: async ({ session, token }) => {
         session.user.id = token.id as string;
         session.user.role = token.role as string;
         return session;
      },
   },
   secret: process.env.AUTH_SECRET,
   pages: { signIn: "/login" },
})
