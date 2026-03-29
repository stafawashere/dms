import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Role } from "@/generated/prisma/enums";

export async function middleware(req: NextRequest) {
   const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      cookieName: req.nextUrl.protocol === "https:"
         ? "__Secure-authjs.session-token"
         : "authjs.session-token",
   });
   const path = req.nextUrl.pathname;

   if (!token && path !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
   }

   if (token && path === "/login") {
      const dest = token.role === Role.ADMIN ? "/admin/dashboard" : "/reseller/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
   }

   if (token?.role === Role.RESELLER && path.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/reseller/dashboard", req.url));
   }

   if (token?.role === Role.ADMIN && path.startsWith("/reseller")) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
   }

   if (token && path === "/") {
      const dest = token.role === Role.ADMIN ? "/admin/dashboard" : "/reseller/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
   }
}

export const config = {
   matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
