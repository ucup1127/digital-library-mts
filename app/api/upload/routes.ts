// app/api/upload/route.ts - perbaiki agar bisa upload ke folder yang benar
import { writeFile, mkdir } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const type = data.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Tentukan folder berdasarkan tipe
    const folder = type === "cover" ? "covers" : "books";
    const uploadDir = path.join(process.cwd(), "public/uploads", folder);
    
    // Buat folder jika belum ada
    await mkdir(uploadDir, { recursive: true });
    
    // Buat nama file unik
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${safeName}`;
    const filePath = path.join(uploadDir, fileName);
    const publicPath = `/uploads/${folder}/${fileName}`;
    
    await writeFile(filePath, buffer);
    
    return NextResponse.json({ url: publicPath });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}