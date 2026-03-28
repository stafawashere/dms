import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";

export async function GET() {
   try {
      const user = await requireAuth();
      if (!isAuthed(user)) return user;

      return NextResponse.json(
         await prisma.product.findMany({ include: { category: true, priceTiers: true } }),
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

      const { name, categoryId, costPrice, sellPrice, unit, description, thumbnail, priceTiers } = await req.json();
      if (!name || !categoryId || costPrice == null || sellPrice == null) {
         return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const product = await prisma.product.create({
         data: {
            name, categoryId, costPrice, sellPrice, unit, description, thumbnail,
            priceTiers: priceTiers?.length ? { create: priceTiers } : undefined,
         },
         include: { category: true, priceTiers: true },
      });

      return NextResponse.json(product, { status: 201 });
   } catch (e) {
      return handleError(e);
   }
}
