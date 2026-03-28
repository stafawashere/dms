import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";

export async function GET() {
   try {
      const user = await requireAuth();
      if (!isAuthed(user)) return user;

      const [sales, inventory] = await Promise.all([
         prisma.sale.findMany({
            where: { resellerId: user.id },
            include: { product: true },
            orderBy: { createdAt: "desc" },
            take: 10,
         }),
         prisma.inventory.findMany({
            where: { userId: user.id },
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
   } catch (e) {
      return handleError(e);
   }
}
