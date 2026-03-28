import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const { id } = await params;

      const sale = await prisma.sale.findUnique({ where: { id } });
      if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
      if (sale.status === "APPROVED") {
         return NextResponse.json({ error: "Sale already approved" }, { status: 400 });
      }

      const updated = await prisma.sale.update({
         where: { id },
         data: { status: "APPROVED" },
         include: { product: true, reseller: { select: { id: true, name: true, email: true } } },
      });

      return NextResponse.json(updated, { status: 200 });
   } catch (e) {
      return handleError(e);
   }
}
