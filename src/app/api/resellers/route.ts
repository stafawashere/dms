import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";
import { ServiceError } from "@/lib/errors";
import { listResellers, createReseller } from "@/lib/services/reseller.service";

export async function GET() {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const resellers = await listResellers();
      return NextResponse.json(resellers, { status: 200 });
   } catch (e) {
      if (e instanceof ServiceError) return NextResponse.json({ error: e.message }, { status: e.statusCode });
      return handleError(e);
   }
}

export async function POST(req: NextRequest) {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const { name, email, password } = await req.json();
      if (!name || !email || !password) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

      const reseller = await createReseller({ name, email, password });

      return NextResponse.json(reseller, { status: 201 });
   } catch (e) {
      if (e instanceof ServiceError) return NextResponse.json({ error: e.message }, { status: e.statusCode });
      return handleError(e);
   }
}
