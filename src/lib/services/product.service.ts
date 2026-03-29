import { prisma } from "@/lib/db";
import { ServiceError } from "@/lib/errors";

export async function listProducts(options?: { activeOnly?: boolean }) {
   return prisma.product.findMany({
      where: options?.activeOnly ? { active: true } : undefined,
      include: { category: true, priceTiers: true },
   });
}

export async function getProduct(id: string) {
   const product = await prisma.product.findUnique({ where: { id }, include: { category: true, priceTiers: true } });
   if (!product) throw new ServiceError("Product not found", 404);
   return product;
}

export async function createProduct(data: {
   name: string;
   categoryId: string;
   costPrice: number;
   sellPrice: number;
   unit?: string;
   description?: string;
   thumbnail?: string;
   priceTiers?: { qty: number; costPrice: number; sellPrice: number }[];
}) {
   const { priceTiers, ...productData } = data;
   return prisma.product.create({
      data: {
         ...productData,
         priceTiers: priceTiers?.length ? { create: priceTiers } : undefined,
      },
      include: { category: true, priceTiers: true },
   });
}

export async function updateProductWithTiers(
   id: string,
   data: {
      name?: string;
      categoryId?: string;
      costPrice?: number;
      sellPrice?: number;
      unit?: string;
      description?: string;
      thumbnail?: string;
      priceTiers?: { qty: number; costPrice: number; sellPrice: number }[];
   }
) {
   const { priceTiers, ...productData } = data;

   const existing = await prisma.product.findUnique({ where: { id } });
   if (!existing) throw new ServiceError("Product not found", 404);

   return prisma.$transaction(async (tx) => {
      if (priceTiers) {
         await tx.priceTier.deleteMany({ where: { productId: id } });
         if (priceTiers.length) {
            await tx.priceTier.createMany({ data: priceTiers.map((t) => ({ ...t, productId: id })) });
         }
      }

      return tx.product.update({
         where: { id },
         data: productData,
         include: { category: true, priceTiers: true },
      });
   });
}

export async function cascadeDeleteProduct(id: string) {
   const existing = await prisma.product.findUnique({ where: { id } });
   if (!existing) throw new ServiceError("Product not found", 404);

   await prisma.$transaction(async (tx) => {
      await tx.sale.deleteMany({ where: { productId: id } });
      await tx.stockMovement.deleteMany({ where: { productId: id } });
      await tx.inventory.deleteMany({ where: { productId: id } });
      await tx.priceTier.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
   });
}
