import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   const { id } = await params;
   const { sales, inventory, movements } = await req.json();

   const existing = await prisma.user.findUnique({ where: { id, role: "RESELLER" } });
   if (!existing) return NextResponse.json({ error: "Reseller not found" }, { status: 404 });

   await prisma.$transaction(async (tx) => {
      if (sales) {
         await tx.sale.deleteMany({ where: { resellerId: id } });
      }
      if (inventory) {
         await tx.inventory.updateMany({ where: { userId: id }, data: { quantity: 0 } });
      }
      if (movements) {
         await tx.stockMovement.deleteMany({ where: { OR: [{ performedById: id }, { userId: id }] } });
      }
   });

   return NextResponse.json({ success: true }, { status: 200 });
}
