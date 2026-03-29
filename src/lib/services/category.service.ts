import { prisma } from "@/lib/db";
import { ServiceError } from "@/lib/errors";

export async function listCategories() {
   return prisma.category.findMany({ include: { _count: { select: { products: true } } } });
}

export async function createCategory(name: string) {
   if (!name) throw new ServiceError("Name is required", 400);
   return prisma.category.create({ data: { name } });
}

export async function updateCategory(id: string, name: string) {
   if (!name) throw new ServiceError("Name is required", 400);
   const existing = await prisma.category.findUnique({ where: { id } });
   if (!existing) throw new ServiceError("Category not found", 404);
   return prisma.category.update({ where: { id }, data: { name } });
}

export async function deleteCategory(id: string) {
   const existing = await prisma.category.findUnique({ where: { id } });
   if (!existing) throw new ServiceError("Category not found", 404);
   await prisma.category.delete({ where: { id } });
}
