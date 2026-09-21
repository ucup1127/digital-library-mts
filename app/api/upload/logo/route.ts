// app/api/upload/logo/route.ts
import { writeFile, mkdir } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { db } from "@/lib/db";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const session = await requireAdmin(); 
    const formData = await request.formData();
    const file = formData.get("logo") as File;
    const schoolId = formData.get("schoolId") as string;

    logger.log("Upload request:", { hasFile: !!file, schoolId });

    if (!file) {
      return NextResponse.json({ error: "File logo tidak ditemukan" }, { status: 400 });
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Hanya file gambar (JPEG, PNG, SVG) yang diperbolehkan` 
      }, { status: 400 });
    }

    // Validasi ukuran (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 2MB" }, { status: 400 });
    }

    // Buat folder jika belum ada
    const uploadDir = path.join(process.cwd(), "public/uploads/schools");
    await mkdir(uploadDir, { recursive: true });

    // Generate nama file unik
    const extension = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    const filePath = path.join(uploadDir, fileName);
    const publicPath = `/uploads/schools/${fileName}`;

    // Simpan file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    logger.log("File saved:", publicPath);

    // ✅ Jika ada schoolId, update logo ke database
    if (schoolId && schoolId !== "temp") {
      await db.school.update({
        where: { id: schoolId },
        data: { logo: publicPath }
      });
      logger.log("Database updated with logo for school:", schoolId);
    }

    return NextResponse.json({ 
      success: true, 
      logoPath: publicPath 
    });
    } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Upload error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Gagal upload logo" 
    }, { status: 500 });
  }
}