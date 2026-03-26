import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
   return NextResponse.json(
      await prisma.product.findMany({ include: { category: true, priceTiers: true } }),
      { status: 200 }
   );
}

export async function POST(req: NextRequest) {
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
}
