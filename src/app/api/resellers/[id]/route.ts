import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";
import { ServiceError } from "@/lib/errors";
import { getReseller, updateReseller, permanentDeleteReseller, deactivateReseller } from "@/lib/services/reseller.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const { id } = await params;
      const reseller = await getReseller(id);
      return NextResponse.json(reseller, { status: 200 });
   } catch (e) {
      if (e instanceof ServiceError) return NextResponse.json({ error: e.message }, { status: e.statusCode });
      return handleError(e);
   }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const { id } = await params;
      const { name, email, password, active } = await req.json();

      const reseller = await updateReseller(id, { name, email, password, active });

      return NextResponse.json(reseller, { status: 200 });
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
      const { searchParams } = new URL(req.url);
      const permanent = searchParams.get("permanent") === "true";

      if (permanent) {
         await permanentDeleteReseller(id);
         return NextResponse.json({ deleted: true }, { status: 200 });
      }

      const reseller = await deactivateReseller(id);
      return NextResponse.json(reseller, { status: 200 });
   } catch (e) {
      if (e instanceof ServiceError) return NextResponse.json({ error: e.message }, { status: e.statusCode });
      return handleError(e);
   }
}
