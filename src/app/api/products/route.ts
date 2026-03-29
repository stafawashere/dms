import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";
import { ServiceError } from "@/lib/errors";
import { listProducts, createProduct } from "@/lib/services/product.service";
import { Role } from "@/generated/prisma/enums";

export async function GET() {
   try {
      const user = await requireAuth();
      if (!isAuthed(user)) return user;

      const activeOnly = user.role !== Role.ADMIN;
      return NextResponse.json(await listProducts({ activeOnly }), { status: 200 });
   } catch (e) {
      if (e instanceof ServiceError) return NextResponse.json({ error: e.message }, { status: e.statusCode });
      return handleError(e);
   }
}

export async function POST(req: NextRequest) {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const { name, categoryId, costPrice, sellPrice, unit, description, thumbnail, priceTiers } = await req.json();
      if (!name || !categoryId || costPrice == null || sellPrice == null) {
         return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const product = await createProduct({ name, categoryId, costPrice, sellPrice, unit, description, thumbnail, priceTiers });

      return NextResponse.json(product, { status: 201 });
   } catch (e) {
      if (e instanceof ServiceError) return NextResponse.json({ error: e.message }, { status: e.statusCode });
      return handleError(e);
   }
}
