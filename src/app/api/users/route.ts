import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
   return NextResponse.json(
      await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true }}),
      { status: 200 }
   );
}
