import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   const { id } = await params;
   const product = await prisma.product.findUnique({ where: { id }, include: { category: true, priceTiers: true } });
   if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
   return NextResponse.json(product, { status: 200 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   const { id } = await params;
   const { name, categoryId, costPrice, sellPrice, unit, description, thumbnail, priceTiers } = await req.json();

   const existing = await prisma.product.findUnique({ where: { id } });
   if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

   const product = await prisma.$transaction(async (tx) => {
      if (priceTiers) {
         await tx.priceTier.deleteMany({ where: { productId: id } });
         if (priceTiers.length) {
            await tx.priceTier.createMany({ data: priceTiers.map((t: { minQty: number; costPrice: number; sellPrice: number }) => ({ ...t, productId: id })) });
         }
      }
      
      return tx.product.update({
         where: { id },
         data: { name, categoryId, costPrice, sellPrice, unit, description, thumbnail },
         include: { category: true, priceTiers: true },
      });
   });

   return NextResponse.json(product, { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   const { id } = await params;
   const existing = await prisma.product.findUnique({ where: { id } });
   if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

   await prisma.$transaction(async (tx) => {
      await tx.sale.deleteMany({ where: { productId: id } });
      await tx.stockMovement.deleteMany({ where: { productId: id } });
      await tx.inventory.deleteMany({ where: { productId: id } });
      await tx.priceTier.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
   });
   return NextResponse.json({ message: "Product deleted" }, { status: 200 });
}
