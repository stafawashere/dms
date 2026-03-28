import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";

export async function GET() {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const [sales, products, inventory] = await Promise.all([
         prisma.sale.findMany({
            where: { status: "APPROVED" },
            include: {
               product: { select: { name: true, costPrice: true, unit: true, category: { select: { name: true } } } },
               reseller: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "asc" },
         }),
         prisma.product.findMany({
            where: { active: true },
            include: { category: true },
         }),
         prisma.inventory.findMany({
            include: { product: true, user: { select: { id: true, name: true, role: true } } },
         }),
      ]);

      const dailySales: Record<string, { date: string; revenue: number; profit: number; units: number }> = {};
      sales.forEach((sale) => {
         const date = new Date(sale.createdAt).toISOString().split("T")[0];
         if (!dailySales[date]) dailySales[date] = { date, revenue: 0, profit: 0, units: 0 };
         const revenue = Number(sale.soldPrice) * sale.quantity;
         const cost = Number(sale.product.costPrice) * sale.quantity;
         dailySales[date].revenue += revenue;
         dailySales[date].profit += revenue - cost;
         dailySales[date].units += sale.quantity;
      });

      const categoryBreakdown: Record<string, { category: string; revenue: number; units: number }> = {};
      sales.forEach((sale) => {
         const cat = sale.product.category.name;
         if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { category: cat, revenue: 0, units: 0 };
         categoryBreakdown[cat].revenue += Number(sale.soldPrice) * sale.quantity;
         categoryBreakdown[cat].units += sale.quantity;
      });

      const productProfitability = products.map((p) => {
         const productSales = sales.filter((s) => s.productId === p.id);
         const revenue = productSales.reduce((s, sale) => s + Number(sale.soldPrice) * sale.quantity, 0);
         const cost = productSales.reduce((s, sale) => s + Number(sale.product.costPrice) * sale.quantity, 0);
         const units = productSales.reduce((s, sale) => s + sale.quantity, 0);
         return {
            name: p.name,
            category: p.category.name,
            revenue,
            cost,
            profit: revenue - cost,
            markup: cost > 0 ? ((revenue - cost) / cost) * 100 : 0,
            units,
         };
      }).sort((a, b) => b.profit - a.profit);

      const resellerPerformance = Object.values(
         sales.reduce((acc, sale) => {
            const key = sale.resellerId;
            if (!acc[key]) acc[key] = { name: sale.reseller.name, revenue: 0, units: 0, sales: 0 };
            acc[key].revenue += Number(sale.soldPrice) * sale.quantity;
            acc[key].units += sale.quantity;
            acc[key].sales += 1;
            return acc;
         }, {} as Record<string, { name: string; revenue: number; units: number; sales: number }>)
      ).sort((a, b) => b.revenue - a.revenue);

      const inventoryValue = inventory.reduce((sum, i) => sum + i.quantity * Number(i.product.costPrice), 0);
      const inventorySellValue = inventory.reduce((sum, i) => sum + i.quantity * Number(i.product.sellPrice), 0);

      return NextResponse.json({
         dailySales: Object.values(dailySales).sort((a, b) => a.date.localeCompare(b.date)),
         categoryBreakdown: Object.values(categoryBreakdown).sort((a, b) => b.revenue - a.revenue),
         productProfitability,
         resellerPerformance,
         inventoryValue,
         inventorySellValue,
      });
   } catch (e) {
      return handleError(e);
   }
}
