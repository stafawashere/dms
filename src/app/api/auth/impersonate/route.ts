import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encode } from "next-auth/jwt";

export async function POST(req: NextRequest) {
   const session = await auth();
   if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   const { userId } = await req.json();
   if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

   const isImpersonating = req.cookies.get("dms-admin-id")?.value;
   const isAdmin = session.user.role === "ADMIN" || isImpersonating;
   if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

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

   if (user.role !== "ADMIN" && !isImpersonating) {
      response.cookies.set("dms-admin-id", session.user.id, {
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
}
