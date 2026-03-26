import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
   const session = await auth();
   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

   const sales = await prisma.sale.findMany({
      where: { resellerId: session.user.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
   });

   return NextResponse.json(sales, { status: 200 });
}

export async function POST(req: NextRequest) {
   const session = await auth();
   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

   const { productId, quantity, soldPrice, notes } = await req.json();
   if (!productId || !quantity || soldPrice == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
   }

   const inventory = await prisma.inventory.findUnique({
      where: { userId_productId: { userId: session.user.id, productId } },
   });

   if (!inventory || inventory.quantity < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
   }

   const [sale] = await prisma.$transaction([
      prisma.sale.create({
         data: { resellerId: session.user.id, productId, quantity, soldPrice, notes },
         include: { product: true },
      }),
      prisma.inventory.update({
         where: { userId_productId: { userId: session.user.id, productId } },
         data: { quantity: { decrement: quantity } },
      }),
   ]);

   return NextResponse.json(sale, { status: 201 });
}
