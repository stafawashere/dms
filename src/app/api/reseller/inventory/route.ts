import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
   const session = await auth();
   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

   const inventory = await prisma.inventory.findMany({
      where: { userId: session.user.id },
      include: { product: { include: { category: true } } },
      orderBy: { product: { name: "asc" } },
   });

   return NextResponse.json(inventory, { status: 200 });
}
