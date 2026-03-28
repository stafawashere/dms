import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

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
   } catch (e) {
      return handleError(e);
   }
}
