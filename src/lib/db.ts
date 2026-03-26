import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const globalFor = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalFor.prisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") {
   globalFor.prisma = prisma;
}
