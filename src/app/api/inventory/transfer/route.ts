import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";
import { ServiceError } from "@/lib/errors";
import { transferStock } from "@/lib/services/inventory.service";

export async function POST(req: NextRequest) {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const { productId, userId, quantity, type, note } = await req.json();
      if (!productId || !userId || quantity == null || !type) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

      const result = await transferStock({ productId, userId, quantity, type, note, performedById: user.id });

      return NextResponse.json(result, { status: 200 });
   } catch (e) {
      if (e instanceof ServiceError) return NextResponse.json({ error: e.message }, { status: e.statusCode });
      return handleError(e);
   }
}
