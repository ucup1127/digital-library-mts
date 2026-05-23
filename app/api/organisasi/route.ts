import { db } from "@/lib/db";
import { writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const name = formData.get("name") as string;
    const position = formData.get("position") as string;
    const order = parseInt(formData.get("order") as string) || 0;

    let imageUrl = null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const filePath = path.join(process.cwd(), "public/uploads", filename);
      await writeFile(filePath, buffer);
      imageUrl = `/uploads/${filename}`;
    }

    const newMember = await db.organization.create({
      data: { name, position, imageUrl, order },
    });

    return NextResponse.json(newMember);
  } catch (error) {
    return NextResponse.json({ error: "Gagal simpan data" }, { status: 500 });
  }
}