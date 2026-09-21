// app/api/organisasi/route.ts
import { db } from "@/lib/db";
import { writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();  // ← tambah ini

    const formData = await request.formData();
    const file = formData.get("image") as File;
    const name = formData.get("name") as string;
    const position = formData.get("position") as string;
    const order = parseInt(formData.get("order") as string) || 0;

    if (!name || !position) {
      return NextResponse.json(
        { error: "Nama dan jabatan wajib diisi" },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null;

    if (file && file.size > 0) {
      // 🔥 Validasi tipe file — cuma gambar
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Hanya file gambar yang diperbolehkan" },
          { status: 400 }
        );
      }

      // 🔥 Validasi ukuran — max 5MB
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Ukuran file maksimal 5MB" },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 🔥 Sanitasi nama file — cegah path traversal
      const safeName = path.basename(file.name).replace(/\s+/g, "-");
      const ext = path.extname(safeName);
      const filename = `${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`;

      const uploadDir = path.join(process.cwd(), "public", "uploads", "organisasi");
      const filePath = path.join(uploadDir, filename);

      // Pastikan di dalam folder uploads
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!filePath.startsWith(uploadsDir)) {
        return NextResponse.json({ error: "Path tidak valid" }, { status: 400 });
      }

      // Buat folder kalau belum ada
      const { mkdir } = await import("fs/promises");
      await mkdir(uploadDir, { recursive: true });

      await writeFile(filePath, buffer);
      imageUrl = `/uploads/organisasi/${filename}`;
    }

    const newMember = await db.organization.create({
      data: { name, position, imageUrl, order },
    });

    return NextResponse.json(newMember);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Gagal simpan data" },
      { status: 500 }
    );
  }
}