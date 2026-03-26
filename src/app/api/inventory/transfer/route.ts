import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
   const { productId, userId, quantity, type, note } = await req.json();
   if (!productId || !userId || quantity == null || !type) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

   const session = await auth();
   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

   const [movement, inventory] = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
         data: { productId, userId, quantity, type, note, performedById: session.user.id },
      });

      const inventory = type === "ADJUSTMENT"
         ? await tx.inventory.upsert({
            where: { userId_productId: { userId, productId } },
            update: { quantity },
            create: { userId, productId, quantity },
         })
         : await tx.inventory.upsert({
            where: { userId_productId: { userId, productId } },
            update: { quantity: { increment: type === "IN" ? quantity : -quantity } },
            create: { userId, productId, quantity },
         });

      return [movement, inventory];
   });

   return NextResponse.json({ inventory, movement }, { status: 200 });
}
