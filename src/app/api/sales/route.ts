import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
   return NextResponse.json(
      await prisma.sale.findMany({
         include: { product: true, reseller: { select: { id: true, name: true, email: true, role: true } } },
         orderBy: { createdAt: "desc" },
      }),
      { status: 200 }
   );
}

export async function POST(req: NextRequest) {
   const { productId, quantity, soldPrice, notes } = await req.json();

   if (!productId || quantity == null || soldPrice == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
   }

   const session = await auth();
   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

   const inventory = await prisma.inventory.findUnique({
      where: { userId_productId: { userId: session.user.id, productId } },
   });

   if (!inventory || inventory.quantity < quantity) {
      return NextResponse.json({ error: "Not enough stock" }, { status: 400 });
   }

   const [sale] = await prisma.$transaction([
      prisma.sale.create({
         data: { productId, quantity, soldPrice, notes, resellerId: session.user.id },
         include: { product: true, reseller: { select: { id: true, name: true } } },
      }),
      prisma.inventory.update({
         where: { userId_productId: { userId: session.user.id, productId } },
         data: { quantity: { decrement: quantity } },
      }),
   ]);

   return NextResponse.json(sale, { status: 201 });
}
