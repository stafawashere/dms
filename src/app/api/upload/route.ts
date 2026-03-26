import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";

export async function POST(req: NextRequest) {
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

   const blob = await put(`thumbnails/${file.name}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      allowOverwrite: true,
   });

   return NextResponse.json({ url: blob.url }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
   const { url } = await req.json();
   if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
   }
   await del(url);
   return NextResponse.json({ success: true }, { status: 200 });
}
