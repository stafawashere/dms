import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
   const session = await auth();
   if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

   const [sales, inventory] = await Promise.all([
      prisma.sale.findMany({
         where: { resellerId: session.user.id },
         include: { product: true },
         orderBy: { createdAt: "desc" },
         take: 10,
      }),
      prisma.inventory.findMany({
         where: { userId: session.user.id },
         include: { product: true },
      }),
   ]);

   const approvedSales = sales.filter((s) => s.status === "APPROVED");
   const pendingSales = sales.filter((s) => s.status === "PENDING");
   const totalSales = approvedSales.length;
   const totalRevenue = approvedSales.reduce((sum, s) => sum + Number(s.soldPrice) * s.quantity, 0);
   const pendingCount = pendingSales.length;
   const pendingRevenue = pendingSales.reduce((sum, s) => sum + Number(s.soldPrice) * s.quantity, 0);
   const totalStock = inventory.reduce((sum, i) => sum + i.quantity, 0);
   const productCount = inventory.filter((i) => i.quantity > 0).length;

   return NextResponse.json({
      stats: { totalSales, totalRevenue, pendingCount, pendingRevenue, totalStock, productCount },
      recentSales: sales,
      inventory,
   }, { status: 200 });
}
