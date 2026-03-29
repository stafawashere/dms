import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";
import { getReportData } from "@/lib/services/reports.service";

export async function GET(req: NextRequest) {
   try {
      const user = await requireAuth(true);
      if (!isAuthed(user)) return user;

      const { searchParams } = new URL(req.url);
      const fromParam = searchParams.get("from");
      const toParam = searchParams.get("to");

      const from = fromParam ? new Date(fromParam + "T00:00:00.000Z") : undefined;
      const to = toParam ? new Date(toParam + "T23:59:59.999Z") : undefined;

      const data = await getReportData({ from, to });
      return NextResponse.json(data);
   } catch (e) {
      return handleError(e);
   }
}
