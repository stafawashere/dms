import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";
import { ServiceError } from "@/lib/errors";
import { getReseller, wipeResellerData } from "@/lib/services/reseller.service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const { id } = await params;
      const { sales, inventory, movements } = await req.json();

      await getReseller(id);
      await wipeResellerData(id, { sales, inventory, movements });

      return NextResponse.json({ success: true }, { status: 200 });
   } catch (e) {
      if (e instanceof ServiceError) return NextResponse.json({ error: e.message }, { status: e.statusCode });
      return handleError(e);
   }
}
