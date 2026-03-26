import { PrismaClient } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
   const password = await bcrypt.hash("password", 10);
   await prisma.user.create({
      data: {
         name: "Admin User",
         email: "admin@example.com",
         password,
         role: "ADMIN"
      }
   });
}

main()
   .catch((e) => {
      console.error(e);
      process.exit(1);
   })
   .finally(async () => {
      await prisma.$disconnect();
   });
