import { prisma } from "@/lib/db";
import { SaleStatus } from "@/generated/prisma/enums";

export async function getResellerDashboardData(userId: string) {
   const [sales, inventory] = await Promise.all([
      prisma.sale.findMany({
         where: { resellerId: userId },
         include: { product: true },
         orderBy: { createdAt: "desc" },
         take: 10,
      }),
      prisma.inventory.findMany({
         where: { userId },
         include: { product: true },
      }),
   ]);

   const approvedSales = sales.filter((s) => s.status === SaleStatus.APPROVED);
   const pendingSales = sales.filter((s) => s.status === SaleStatus.PENDING);
   const totalSales = approvedSales.length;
   const totalRevenue = approvedSales.reduce((sum, s) => sum + Number(s.soldPrice) * s.quantity, 0);
   const pendingCount = pendingSales.length;
   const pendingRevenue = pendingSales.reduce((sum, s) => sum + Number(s.soldPrice) * s.quantity, 0);
   const totalStock = inventory.reduce((sum, i) => sum + i.quantity, 0);
   const productCount = inventory.filter((i) => i.quantity > 0).length;

   return {
      stats: { totalSales, totalRevenue, pendingCount, pendingRevenue, totalStock, productCount },
      recentSales: sales,
      inventory,
   };
}
