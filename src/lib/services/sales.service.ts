import { prisma } from "@/lib/db";
import { ServiceError } from "@/lib/errors";
import { SaleStatus } from "@/generated/prisma/enums";

export async function createSale(params: {
   resellerId: string;
   productId: string;
   quantity: number;
   soldPrice: number;
   notes: string | null;
   includeReseller?: boolean;
}) {
   const { resellerId, productId, quantity, soldPrice, notes, includeReseller } = params;

   if (!productId || quantity == null || quantity <= 0 || soldPrice == null) {
      throw new ServiceError("Missing required fields", 400);
   }

   const inventory = await prisma.inventory.findUnique({
      where: { userId_productId: { userId: resellerId, productId } },
   });

   if (!inventory || inventory.quantity < quantity) {
      throw new ServiceError("Not enough stock", 400);
   }

   const [sale] = await prisma.$transaction([
      prisma.sale.create({
         data: { productId, quantity, soldPrice, notes, resellerId },
         include: {
            product: true,
            ...(includeReseller
               ? { reseller: { select: { id: true, name: true } } }
               : {}),
         },
      }),
      prisma.inventory.update({
         where: { userId_productId: { userId: resellerId, productId } },
         data: { quantity: { decrement: quantity } },
      }),
   ]);

   return sale;
}

export async function deleteSaleAndRestoreStock(saleId: string) {
   const sale = await prisma.sale.findUnique({ where: { id: saleId } });
   if (!sale) {
      throw new ServiceError("Sale not found", 404);
   }

   await prisma.$transaction([
      prisma.sale.delete({ where: { id: saleId } }),
      prisma.inventory.update({
         where: { userId_productId: { userId: sale.resellerId, productId: sale.productId } },
         data: { quantity: { increment: sale.quantity } },
      }),
   ]);
}

export async function listSales() {
   return prisma.sale.findMany({
      include: { product: true, reseller: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
   });
}

export async function getSale(id: string) {
   const sale = await prisma.sale.findUnique({
      where: { id },
      include: { product: true, reseller: { select: { id: true, name: true, email: true } } },
   });
   if (!sale) throw new ServiceError("Sale not found", 404);
   return sale;
}

export async function listResellerSales(resellerId: string) {
   return prisma.sale.findMany({
      where: { resellerId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
   });
}

export async function approveSale(saleId: string) {
   const sale = await prisma.sale.findUnique({ where: { id: saleId } });
   if (!sale) {
      throw new ServiceError("Sale not found", 404);
   }
   if (sale.status === SaleStatus.APPROVED) {
      throw new ServiceError("Sale already approved", 400);
   }

   const updated = await prisma.sale.update({
      where: { id: saleId },
      data: { status: SaleStatus.APPROVED },
      include: { product: true, reseller: { select: { id: true, name: true, email: true } } },
   });

   return updated;
}
