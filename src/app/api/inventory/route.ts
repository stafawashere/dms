import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";

export async function GET() {
   try {
      const user = await requireAuth();
      if (!isAuthed(user)) return user;

      const isAdmin = user.role === "ADMIN";
      const inventory = await prisma.inventory.findMany({
         where: isAdmin ? undefined : { userId: user.id },
         include: { user: true, product: true },
      });

      return NextResponse.json(inventory, { status: 200 });
   } catch (e) {
      return handleError(e);
   }
}
