import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encode } from "next-auth/jwt";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
   try {
      const adminCookie = req.cookies.get("dms-admin-id")?.value;
      let adminId: string;

      if (adminCookie) {
         const originalAdmin = await prisma.user.findUnique({
            where: { id: adminCookie, role: "ADMIN" },
            select: { id: true },
         });
         if (!originalAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
         }
         adminId = originalAdmin.id;
      } else {
         const admin = await requireAuth(true);
         if (!isAuthed(admin)) return admin;
         adminId = admin.id;
      }

      const { userId } = await req.json();
      if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

      const user = await prisma.user.findUnique({
         where: { id: userId },
         select: { id: true, name: true, email: true, role: true, active: true },
      });

      if (!user) {
         return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const isSecure = process.env.NODE_ENV === "production";
      const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";

      const token = await encode({
         token: { id: user.id, role: user.role, name: user.name, email: user.email },
         secret: process.env.AUTH_SECRET!,
         salt: cookieName,
      });

      const response = NextResponse.json({ success: true, role: user.role });

      response.cookies.set(cookieName, token, {
         httpOnly: true,
         secure: isSecure,
         sameSite: "lax",
         path: "/",
         maxAge: 30 * 24 * 60 * 60,
      });

      if (user.role !== "ADMIN" && !adminCookie) {
         response.cookies.set("dms-admin-id", adminId, {
            httpOnly: false,
            secure: isSecure,
            sameSite: "lax",
            path: "/",
            maxAge: 30 * 24 * 60 * 60,
         });
      }

      if (user.role === "ADMIN") {
         response.cookies.delete("dms-admin-id");
      }

      return response;
   } catch (e) {
      return handleError(e);
   }
}
