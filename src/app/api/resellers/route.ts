import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
   const resellers = await prisma.user.findMany({
      where: { role: "RESELLER" },
      select: {
         id: true,
         name: true,
         email: true,
         active: true,
         createdAt: true,
         _count: { select: { sales: true, inventory: true } },
      },
      orderBy: { createdAt: "desc" },
   });
   return NextResponse.json(resellers, { status: 200 });
}

export async function POST(req: NextRequest) {
   const { name, email, password } = await req.json();
   if (!name || !email || !password) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

   const exists = await prisma.user.findUnique({ where: { email } });
   if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 400 });

   const hashed = await bcrypt.hash(password, 10);
   const reseller = await prisma.user.create({
      data: { name, email, password: hashed, role: "RESELLER" },
      select: { id: true, name: true, email: true, active: true, createdAt: true },
   });

   return NextResponse.json(reseller, { status: 201 });
}
