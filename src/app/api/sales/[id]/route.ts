import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const { id } = await params;

      const sale = await prisma.sale.findUnique({
         where: { id },
         include: { product: true, reseller: { select: { id: true, name: true, email: true } } },
      });

      if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
      return NextResponse.json(sale, { status: 200 });
   } catch (e) {
      return handleError(e);
   }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const { id } = await params;

      const sale = await prisma.sale.findUnique({ where: { id } });
      if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

      await prisma.$transaction([
         prisma.sale.delete({ where: { id } }),
         prisma.inventory.update({
            where: { userId_productId: { userId: sale.resellerId, productId: sale.productId } },
            data: { quantity: { increment: sale.quantity } },
         }),
      ]);

      return NextResponse.json({ message: "Sale deleted, stock restored" }, { status: 200 });
   } catch (e) {
      return handleError(e);
   }
}
