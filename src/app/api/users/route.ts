import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";

export async function GET() {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      return NextResponse.json(
         await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true }}),
         { status: 200 }
      );
   } catch (e) {
      return handleError(e);
   }
}
