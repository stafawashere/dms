import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const { id } = await params;
      const { name } = await req.json();
      if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

      const existing = await prisma.category.findUnique({ where: { id: id } });
      if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

      const category = await prisma.category.update({ where: { id: id }, data: { name } });
      return NextResponse.json(category, { status: 200 });
   } catch (e) {
      return handleError(e);
   }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const { id } = await params;
      const existing = await prisma.category.findUnique({ where: { id: id } });
      if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

      await prisma.category.delete({ where: { id: id } });
      return NextResponse.json({ message: "Category deleted" }, { status: 200 });
   } catch (e) {
      return handleError(e);
   }
}
