import { NextResponse } from "next/server";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";
import { ServiceError } from "@/lib/errors";
import { getResellerDashboardData } from "@/lib/services/reseller-dashboard.service";

export async function GET() {
   try {
      const user = await requireAuth();
      if (!isAuthed(user)) return user;

      const data = await getResellerDashboardData(user.id);
      return NextResponse.json(data, { status: 200 });
   } catch (e) {
      if (e instanceof ServiceError) return NextResponse.json({ error: e.message }, { status: e.statusCode });
      return handleError(e);
   }
}
