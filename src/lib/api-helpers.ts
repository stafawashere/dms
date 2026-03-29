import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ServiceError } from "@/lib/errors";
import { Role } from "@/generated/prisma/enums";

type AuthResult = {
   id: string;
   role: string;
};

export async function requireAuth(adminOnly = false): Promise<AuthResult | NextResponse> {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
   if (adminOnly && session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
   }
   return { id: session.user.id, role: session.user.role };
}

export function isAuthed(result: AuthResult | NextResponse): result is AuthResult {
   return !(result instanceof NextResponse);
}

export function apiError(message: string, status = 400) {
   return NextResponse.json({ error: message }, { status });
}

export function handleError(e: unknown) {
   console.error(e);
   return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

type AuthedUser = { id: string; role: string };

export function withAuth(
   handler: (user: AuthedUser, req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse>,
   adminOnly = false
) {
   return async (req: NextRequest, ctx: { params: Promise<Record<string, string>> } = { params: Promise.resolve({}) }) => {
      try {
         const user = await requireAuth(adminOnly);
         if (!isAuthed(user)) return user;
         return await handler(user, req, ctx);
      } catch (e) {
         if (e instanceof ServiceError) return NextResponse.json({ error: e.message }, { status: e.statusCode });
         return handleError(e);
      }
   };
}
