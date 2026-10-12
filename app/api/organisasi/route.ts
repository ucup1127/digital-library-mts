// app/api/organisasi/route.ts
import { db } from "@/lib/db";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
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

      // Max 4MB (limit Vercel serverless)
      if (file.size > 4 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Ukuran file maksimal 4MB" },
          { status: 400 }
        );
      }

      // Generate nama file unik
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
      const pathname = `organisasi/${filename}`;

      // Upload ke Blob
      const blob = await put(pathname, file, {
        access: "public",
        addRandomSuffix: false,
      });

      imageUrl = blob.url;
      logger.log("✅ Organisasi image uploaded:", blob.url);
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