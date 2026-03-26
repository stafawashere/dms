import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
   return NextResponse.json(
      await prisma.category.findMany({ include: { _count: { select: { products: true } } } }),
      { status: 200 }
   );
}

export async function POST(req: NextRequest) {
   const { name } = await req.json();
   if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

   const category = await prisma.category.create({ data: { name } });
   return NextResponse.json(category, { status: 201 });
}
