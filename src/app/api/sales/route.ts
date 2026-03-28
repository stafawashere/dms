import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";

export async function GET() {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      return NextResponse.json(
         await prisma.sale.findMany({
            include: { product: true, reseller: { select: { id: true, name: true, email: true, role: true } } },
            orderBy: { createdAt: "desc" },
         }),
         { status: 200 }
      );
   } catch (e) {
      return handleError(e);
   }
}

export async function POST(req: NextRequest) {
   try {
      const user = await requireAuth();
      if (!isAuthed(user)) return user;

      const { productId, quantity, soldPrice, notes } = await req.json();

      if (!productId || quantity == null || soldPrice == null) {
         return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const inventory = await prisma.inventory.findUnique({
         where: { userId_productId: { userId: user.id, productId } },
      });

      if (!inventory || inventory.quantity < quantity) {
         return NextResponse.json({ error: "Not enough stock" }, { status: 400 });
      }

      const [sale] = await prisma.$transaction([
         prisma.sale.create({
            data: { productId, quantity, soldPrice, notes, resellerId: user.id },
            include: { product: true, reseller: { select: { id: true, name: true } } },
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
