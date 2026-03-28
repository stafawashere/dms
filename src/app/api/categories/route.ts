import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";

export async function GET() {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      return NextResponse.json(
         await prisma.category.findMany({ include: { _count: { select: { products: true } } } }),
         { status: 200 }
      );
   } catch (e) {
      return handleError(e);
   }
}

export async function POST(req: NextRequest) {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const { name } = await req.json();
      if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

      const category = await prisma.category.create({ data: { name } });
      return NextResponse.json(category, { status: 201 });
   } catch (e) {
      return handleError(e);
   }
}
