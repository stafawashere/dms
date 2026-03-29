import { NextResponse } from "next/server";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";
import { getDashboardData } from "@/lib/services/dashboard.service";

export async function GET() {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const data = await getDashboardData();
      return NextResponse.json(data);
   } catch (e) {
      return handleError(e);
   }
}
