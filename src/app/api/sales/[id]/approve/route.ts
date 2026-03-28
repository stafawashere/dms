import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   const { id } = await params;

   const session = await auth();
   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

   const user = await prisma.user.findUnique({ where: { id: session.user.id } });
   if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
   }

   const sale = await prisma.sale.findUnique({ where: { id } });
   if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
   if (sale.status === "APPROVED") {
      return NextResponse.json({ error: "Sale already approved" }, { status: 400 });
   }

   const updated = await prisma.sale.update({
      where: { id },
      data: { status: "APPROVED" },
      include: { product: true, reseller: { select: { id: true, name: true, email: true } } },
   });

   return NextResponse.json(updated, { status: 200 });
}
