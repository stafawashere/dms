import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
   try {
   const now = new Date();
   const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
   const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

   const [
      products,
      resellers,
      allSales,
      recentSales,
      inventory,
      recentMovements,
   ] = await Promise.all([
      prisma.product.count({ where: { active: true } }),
      prisma.user.count({ where: { role: "RESELLER", active: true } }),
      prisma.sale.findMany({ where: { status: "APPROVED" }, include: { product: true, reseller: { select: { name: true } } } }),
      prisma.sale.findMany({
         where: { createdAt: { gte: sevenDaysAgo } },
         include: { product: true, reseller: { select: { name: true } } },
         orderBy: { createdAt: "desc" },
         take: 10,
      }),
      prisma.inventory.findMany({ include: { product: true, user: { select: { name: true, role: true } } } }),
      prisma.stockMovement.findMany({
         orderBy: { createdAt: "desc" },
         take: 10,
         include: {
            product: { select: { name: true } },
            user: { select: { name: true } },
            performedBy: { select: { name: true } },
         },
      }),
   ]);

   const pendingSalesCount = await prisma.sale.count({ where: { status: "PENDING" } });

   const totalRevenue = allSales.reduce((s, sale) => s + Number(sale.soldPrice) * sale.quantity, 0);
   const totalCost = allSales.reduce((s, sale) => s + Number(sale.product.costPrice) * sale.quantity, 0);
   const totalProfit = totalRevenue - totalCost;
   const totalUnits = allSales.reduce((s, sale) => s + sale.quantity, 0);
   const totalStock = inventory.reduce((s, i) => s + i.quantity, 0);

   const monthlySales = allSales.filter((s) => new Date(s.createdAt) >= thirtyDaysAgo);
   const monthlyRevenue = monthlySales.reduce((s, sale) => s + Number(sale.soldPrice) * sale.quantity, 0);

   const lowStock = inventory
      .filter((i) => i.quantity > 0 && i.quantity <= 10)
      .map((i) => ({ product: i.product.name, user: i.user.name, quantity: i.quantity, unit: i.product.unit }));

   const topProducts = Object.values(
      allSales.reduce((acc, sale) => {
         const key = sale.productId;
         if (!acc[key]) acc[key] = { name: sale.product.name, revenue: 0, units: 0 };
         acc[key].revenue += Number(sale.soldPrice) * sale.quantity;
         acc[key].units += sale.quantity;
         return acc;
      }, {} as Record<string, { name: string; revenue: number; units: number }>)
   ).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

   const topResellers = Object.values(
      allSales.reduce((acc, sale) => {
         const key = sale.resellerId;
         if (!acc[key]) acc[key] = { name: sale.reseller.name, revenue: 0, sales: 0 };
         acc[key].revenue += Number(sale.soldPrice) * sale.quantity;
         acc[key].sales += 1;
         return acc;
      }, {} as Record<string, { name: string; revenue: number; sales: number }>)
   ).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

   return NextResponse.json({
      stats: { products, resellers, totalRevenue, totalProfit, totalUnits, totalStock, monthlyRevenue, pendingSalesCount },
      recentSales,
      recentMovements,
      lowStock,
      topProducts,
      topResellers,
   });
   } catch (e) {
      console.error("Dashboard error:", e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
   }
}
