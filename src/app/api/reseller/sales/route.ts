import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";

export async function GET() {
   try {
      const user = await requireAuth();
      if (!isAuthed(user)) return user;

      const sales = await prisma.sale.findMany({
         where: { resellerId: user.id },
         include: { product: true },
         orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(sales, { status: 200 });
   } catch (e) {
      return handleError(e);
   }
}

export async function POST(req: NextRequest) {
   try {
      const user = await requireAuth();
      if (!isAuthed(user)) return user;

      const { productId, quantity, soldPrice, notes } = await req.json();
      if (!productId || !quantity || soldPrice == null) {
         return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const inventory = await prisma.inventory.findUnique({
         where: { userId_productId: { userId: user.id, productId } },
      });

      if (!inventory || inventory.quantity < quantity) {
         return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
      }

      const [sale] = await prisma.$transaction([
         prisma.sale.create({
            data: { resellerId: user.id, productId, quantity, soldPrice, notes },
            include: { product: true },
         }),
         prisma.inventory.update({
            where: { userId_productId: { userId: user.id, productId } },
            data: { quantity: { decrement: quantity } },
         }),
      ]);

      return NextResponse.json(sale, { status: 201 });
   } catch (e) {
      return handleError(e);
   }
}
