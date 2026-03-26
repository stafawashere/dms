import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
   return NextResponse.json(
      await prisma.inventory.findMany({ include: { user: true, product: true } }),
      { status: 200 }
   );
}
