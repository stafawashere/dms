import { prisma } from "@/lib/db";
import { ServiceError } from "@/lib/errors";
import { Role, SaleStatus } from "@/generated/prisma/enums";

export async function listResellers() {
   return prisma.user.findMany({
      where: { role: Role.RESELLER },
      select: {
         id: true, name: true, email: true, active: true, createdAt: true,
         _count: { select: { sales: true, inventory: true } },
      },
      orderBy: { createdAt: "desc" },
   });
}

export async function getReseller(id: string) {
   const reseller = await prisma.user.findUnique({
      where: { id, role: Role.RESELLER },
      select: {
         id: true, name: true, email: true, active: true, createdAt: true,
         inventory: { include: { product: true } },
         sales: { where: { status: SaleStatus.APPROVED }, include: { product: true }, orderBy: { createdAt: "desc" }, take: 20 },
      },
   });
   if (!reseller) throw new ServiceError("Reseller not found", 404);
   return reseller;
}

export async function createReseller(data: { name: string; email: string; password: string }) {
   const exists = await prisma.user.findUnique({ where: { email: data.email } });
   if (exists) throw new ServiceError("Email already in use", 400);
   const bcrypt = (await import("bcryptjs")).default;
   const hashed = await bcrypt.hash(data.password, 10);
   return prisma.user.create({
      data: { name: data.name, email: data.email, password: hashed, role: Role.RESELLER },
      select: { id: true, name: true, email: true, active: true, createdAt: true },
   });
}

export async function updateReseller(id: string, data: { name?: string; email?: string; password?: string; active?: boolean }) {
   const existing = await prisma.user.findUnique({ where: { id, role: Role.RESELLER } });
   if (!existing) throw new ServiceError("Reseller not found", 404);

   if (data.email && data.email !== existing.email) {
      const taken = await prisma.user.findUnique({ where: { email: data.email } });
      if (taken) throw new ServiceError("Email already in use", 400);
   }

   const update: Record<string, unknown> = {};
   if (data.name !== undefined) update.name = data.name;
   if (data.email !== undefined) update.email = data.email;
   if (data.active !== undefined) update.active = data.active;
   if (data.password) {
      const bcrypt = (await import("bcryptjs")).default;
      update.password = await bcrypt.hash(data.password, 10);
   }

   return prisma.user.update({
      where: { id },
      data: update,
      select: { id: true, name: true, email: true, active: true, createdAt: true },
   });
}

export async function deactivateReseller(id: string) {
   const existing = await prisma.user.findUnique({ where: { id, role: Role.RESELLER } });
   if (!existing) throw new ServiceError("Reseller not found", 404);
   return prisma.user.update({
      where: { id },
      data: { active: false },
      select: { id: true, name: true, email: true, active: true },
   });
}

export async function permanentDeleteReseller(id: string) {
   const existing = await prisma.user.findUnique({ where: { id, role: Role.RESELLER } });
   if (!existing) throw new ServiceError("Reseller not found", 404);
   if (existing.active) throw new ServiceError("Deactivate reseller before permanently deleting", 400);
   await cascadeDeleteReseller(id);
}

export async function cascadeDeleteReseller(id: string) {
   const existing = await prisma.user.findUnique({ where: { id } });
   if (!existing) throw new ServiceError("Reseller not found", 404);

   await prisma.$transaction(async (tx) => {
      await tx.sale.deleteMany({ where: { resellerId: id } });
      await tx.inventory.deleteMany({ where: { userId: id } });
      await tx.stockMovement.deleteMany({ where: { OR: [{ performedById: id }, { userId: id }] } });
      await tx.user.delete({ where: { id } });
   });
}

export async function wipeResellerData(id: string, options: {
   sales: boolean;
   inventory: boolean;
   movements: boolean;
}) {
   await prisma.$transaction(async (tx) => {
      if (options.sales) {
         await tx.sale.deleteMany({ where: { resellerId: id } });
      }
      if (options.inventory) {
         await tx.inventory.updateMany({ where: { userId: id }, data: { quantity: 0 } });
      }
      if (options.movements) {
         await tx.stockMovement.deleteMany({ where: { OR: [{ performedById: id }, { userId: id }] } });
      }
   });
}
