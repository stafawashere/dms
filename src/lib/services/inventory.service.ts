import { prisma } from "@/lib/db";
import { ServiceError } from "@/lib/errors";
import { MovementType } from "@/generated/prisma/enums";

export async function listInventory(userId?: string) {
   return prisma.inventory.findMany({
      where: userId ? { userId } : undefined,
      include: { user: true, product: true },
   });
}

export async function listResellerInventory(userId: string) {
   return prisma.inventory.findMany({
      where: { userId },
      include: { product: { include: { category: true } } },
      orderBy: { product: { name: "asc" } },
   });
}

export async function transferStock(params: {
   productId: string;
   userId: string;
   quantity: number;
   type: MovementType;
   note: string | null;
   performedById: string;
}) {
   const { productId, userId, quantity, type, note, performedById } = params;

   if (!productId || !userId) throw new ServiceError("Missing required fields", 400);
   if (quantity <= 0) throw new ServiceError("Quantity must be positive", 400);

   if (type === MovementType.OUT) {
      const row = await prisma.inventory.findUnique({
         where: { userId_productId: { userId, productId } },
      });
      const available = row?.quantity ?? 0;
      if (available < quantity) {
         throw new ServiceError("Insufficient stock for this transfer", 400);
      }
   }

   const [movement, inventory] = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
         data: { productId, userId, quantity, type, note, performedById },
      });

      const inventory = type === MovementType.ADJUSTMENT
         ? await tx.inventory.upsert({
            where: { userId_productId: { userId, productId } },
            update: { quantity },
            create: { userId, productId, quantity },
         })
         : await tx.inventory.upsert({
            where: { userId_productId: { userId, productId } },
            update: { quantity: { increment: type === MovementType.IN ? quantity : -quantity } },
            create: { userId, productId, quantity },
         });

      return [movement, inventory];
   });

   return { inventory, movement };
}
