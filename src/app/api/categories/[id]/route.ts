import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";
import { ServiceError } from "@/lib/errors";
import { updateCategory, deleteCategory } from "@/lib/services/category.service";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const { id } = await params;
      const { name } = await req.json();
      const category = await updateCategory(id, name);
      return NextResponse.json(category, { status: 200 });
   } catch (e) {
      if (e instanceof ServiceError) return NextResponse.json({ error: e.message }, { status: e.statusCode });
      return handleError(e);
   }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const { id } = await params;
      await deleteCategory(id);
      return NextResponse.json({ message: "Category deleted" }, { status: 200 });
   } catch (e) {
      if (e instanceof ServiceError) return NextResponse.json({ error: e.message }, { status: e.statusCode });
      return handleError(e);
   }
}
