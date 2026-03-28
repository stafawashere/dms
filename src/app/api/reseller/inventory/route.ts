import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";

export async function GET() {
   try {
      const user = await requireAuth();
      if (!isAuthed(user)) return user;

      const inventory = await prisma.inventory.findMany({
         where: { userId: user.id },
         include: { product: { include: { category: true } } },
         orderBy: { product: { name: "asc" } },
      });

      return NextResponse.json(inventory, { status: 200 });
   } catch (e) {
      return handleError(e);
   }
}
