import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

type AuthResult = {
   id: string;
   role: string;
};

export async function requireAuth(adminOnly = false): Promise<AuthResult | NextResponse> {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
   if (adminOnly && session.user.role !== "ADMIN") {
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
