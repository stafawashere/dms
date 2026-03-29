import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { requireAuth, isAuthed, handleError } from "@/lib/api-helpers";

const MIME_TO_EXT: Record<string, string> = {
   "image/jpeg": "jpg",
   "image/png": "png",
   "image/webp": "webp",
   "image/gif": "gif",
};

export async function POST(req: NextRequest) {
   try {
      const user = await requireAuth();
      if (!isAuthed(user)) return user;

      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
         return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
         return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
      }

      if (file.size > 5 * 1024 * 1024) {
         return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
      }

      const ext = MIME_TO_EXT[file.type];
      const key = `thumbnails/${randomUUID()}.${ext}`;

      const blob = await put(key, file, {
         access: "public",
         token: process.env.BLOB_READ_WRITE_TOKEN!,
      });

      return NextResponse.json({ url: blob.url }, { status: 201 });
   } catch (e) {
      return handleError(e);
   }
}

export async function DELETE(req: NextRequest) {
   try {
      const user = await requireAuth();
      if (!isAuthed(user)) return user;

      const { url } = await req.json();
      if (!url) {
         return NextResponse.json({ error: "No URL provided" }, { status: 400 });
      }
      await del(url);
      return NextResponse.json({ success: true }, { status: 200 });
   } catch (e) {
      return handleError(e);
   }
}
