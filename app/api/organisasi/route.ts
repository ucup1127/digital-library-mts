// app/api/organisasi/route.ts
import { db } from "@/lib/db";
import { writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createOrganisasiSchema, formatZodError } from "@/lib/validations";
import { logAdminActivityServer } from "@/lib/admin-log-server";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("image") as File;
    const name = formData.get("name") as string;
    const position = formData.get("position") as string;
    const order = formData.get("order") as string;

    // 🔥 Validasi pakai Zod (parse FormData dulu)
    const parseResult = createOrganisasiSchema.safeParse({
      name,
      position,
      order: order || "0",
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { name: validName, position: validPosition, order: validOrder } = parseResult.data;

    let imageUrl: string | null = null;

    if (file && file.size > 0) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Hanya file gambar yang diperbolehkan" },
          { status: 400 }
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Ukuran file maksimal 5MB" },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const safeName = path.basename(file.name).replace(/\s+/g, "-");
      const ext = path.extname(safeName);
      const filename = `${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`;

      const uploadDir = path.join(process.cwd(), "public", "uploads", "organisasi");
      const filePath = path.join(uploadDir, filename);

      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!filePath.startsWith(uploadsDir)) {
        return NextResponse.json({ error: "Path tidak valid" }, { status: 400 });
      }

      const { mkdir } = await import("fs/promises");
      await mkdir(uploadDir, { recursive: true });

      await writeFile(filePath, buffer);
      imageUrl = `/uploads/organisasi/${filename}`;
    }

    const newMember = await db.organization.create({
      data: {
        name: validName,
        position: validPosition,
        imageUrl,
        order: validOrder,
      },
    });

    // 🔥 Log aktivitas
    await logAdminActivityServer({
      action: "CREATE",
      targetType: "ORGANISASI",
      targetId: newMember.id,
      targetName: newMember.name,
    });

    return NextResponse.json(newMember);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error creating organization:", error);
    return NextResponse.json({ error: "Gagal simpan data" }, { status: 500 });
  }
}