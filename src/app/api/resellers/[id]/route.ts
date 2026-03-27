import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   const { id } = await params;

   const reseller = await prisma.user.findUnique({
      where: { id, role: "RESELLER" },
      select: {
         id: true,
         name: true,
         email: true,
         active: true,
         createdAt: true,
         inventory: { include: { product: true } },
         sales: { include: { product: true }, orderBy: { createdAt: "desc" }, take: 20 },
      },
   });

   if (!reseller) return NextResponse.json({ error: "Reseller not found" }, { status: 404 });
   return NextResponse.json(reseller, { status: 200 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   const { id } = await params;
   const { name, email, password, active } = await req.json();

   const existing = await prisma.user.findUnique({ where: { id, role: "RESELLER" } });
   if (!existing) return NextResponse.json({ error: "Reseller not found" }, { status: 404 });

   if (email && email !== existing.email) {
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken) return NextResponse.json({ error: "Email already in use" }, { status: 400 });
   }

   const data: Record<string, unknown> = {};
   if (name !== undefined) data.name = name;
   if (email !== undefined) data.email = email;
   if (active !== undefined) data.active = active;
   if (password) data.password = await bcrypt.hash(password, 10);

   const reseller = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, active: true, createdAt: true },
   });

   return NextResponse.json(reseller, { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   const { id } = await params;
   const { searchParams } = new URL(req.url);
   const permanent = searchParams.get("permanent") === "true";

   const existing = await prisma.user.findUnique({ where: { id, role: "RESELLER" } });
   if (!existing) return NextResponse.json({ error: "Reseller not found" }, { status: 404 });

   if (permanent) {
      if (existing.active) {
         return NextResponse.json({ error: "Deactivate reseller before permanently deleting" }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
         await tx.sale.deleteMany({ where: { resellerId: id } });
         await tx.inventory.deleteMany({ where: { userId: id } });
         await tx.stockMovement.deleteMany({ where: { OR: [{ performedById: id }, { userId: id }] } });
         await tx.user.delete({ where: { id } });
      });

      return NextResponse.json({ deleted: true }, { status: 200 });
   }

   const reseller = await prisma.user.update({
      where: { id },
      data: { active: false },
      select: { id: true, name: true, email: true, active: true },
   });

   return NextResponse.json(reseller, { status: 200 });
}
