import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";
import { ServiceError } from "@/lib/errors";
import { listSales, createSale } from "@/lib/services/sales.service";

export async function GET() {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      return NextResponse.json(await listSales(), { status: 200 });
   } catch (e) {
      if (e instanceof ServiceError) return NextResponse.json({ error: e.message }, { status: e.statusCode });
      return handleError(e);
   }
}

export async function POST(req: NextRequest) {
   try {
      const user = await requireAuth();
      if (!isAuthed(user)) return user;

      const { productId, quantity, soldPrice, notes } = await req.json();
      const sale = await createSale({
         resellerId: user.id,
         productId,
         quantity,
         soldPrice,
         notes: notes ?? null,
         includeReseller: true,
      });

      return NextResponse.json(sale, { status: 201 });
   } catch (e) {
      if (e instanceof ServiceError) return NextResponse.json({ error: e.message }, { status: e.statusCode });
      return handleError(e);
   }
}
