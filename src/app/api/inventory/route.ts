import { NextResponse } from "next/server";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";
import { ServiceError } from "@/lib/errors";
import { listInventory } from "@/lib/services/inventory.service";
import { Role } from "@/generated/prisma/enums";

export async function GET() {
   try {
      const user = await requireAuth();
      if (!isAuthed(user)) return user;

      const isAdmin = user.role === Role.ADMIN;
      const inventory = await listInventory(isAdmin ? undefined : user.id);

      return NextResponse.json(inventory, { status: 200 });
   } catch (e) {
      if (e instanceof ServiceError) return NextResponse.json({ error: e.message }, { status: e.statusCode });
      return handleError(e);
   }
}
