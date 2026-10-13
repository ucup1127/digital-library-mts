// app/api/upload/logo/route.ts
import { put, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import sharp from "sharp";

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("logo") as File;
    const schoolId = formData.get("schoolId") as string;

    logger.log("Upload logo request:", { hasFile: !!file, schoolId });

    if (!file) {
      return NextResponse.json({ error: "File logo tidak ditemukan" }, { status: 400 });
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Hanya file gambar (JPEG, PNG, SVG, WebP) yang diperbolehkan" },
        { status: 400 }
      );
    }

    // Validasi ukuran (max 4MB — limit Vercel serverless)
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 4MB" }, { status: 400 });
    }

    // Generate nama file unik
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);

    // ⚠️ SVG jangan di-optimasi dengan sharp (bisa rusak)
    let optimizedBuffer: Buffer;
    let extension: string;

    if (file.type === "image/svg+xml") {
      // SVG: upload as-is
      const arrayBuffer = await file.arrayBuffer();
      optimizedBuffer = Buffer.from(arrayBuffer);
      extension = "svg";
      logger.log("SVG logo uploaded as-is (no optimization)");
    } else {
      // Raster image: optimize dengan sharp
      try {
        const arrayBuffer = await file.arrayBuffer();
        const originalBuffer = Buffer.from(arrayBuffer);

        optimizedBuffer = await sharp(originalBuffer)
          .resize(200, 200, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer();

        extension = "webp";

        const saved = ((1 - optimizedBuffer.length / file.size) * 100).toFixed(1);
        logger.log(
          `✅ Logo optimized: ${file.size} → ${optimizedBuffer.length} bytes (saved ${saved}%)`
        );
      } catch (sharpError) {
        logger.error("Sharp logo optimization failed, fallback to original:", sharpError);
        const arrayBuffer = await file.arrayBuffer();
        optimizedBuffer = Buffer.from(arrayBuffer);
        extension = file.name.split(".").pop() || "png";
      }
    }

    const pathname = `logos/${timestamp}-${random}.${extension}`;

    // Kalau schoolId valid & bukan "temp", hapus logo lama dulu
    if (schoolId && schoolId !== "temp") {
      try {
        const existing = await db.school.findUnique({
          where: { id: schoolId },
          select: { logo: true },
        });
        if (existing?.logo && existing.logo.includes("blob.vercel-storage.com")) {
          try {
            await del(existing.logo, { token: process.env.BLOB_SG_READ_WRITE_TOKEN });
            logger.log("Old logo deleted from Blob:", existing.logo);
          } catch (e) {
            logger.warn("Gagal hapus logo lama:", existing.logo);
          }
        }
      } catch (e) {
        logger.warn("Gagal cek logo lama:", e);
      }
    }

    // Upload ke Blob
    const blob = await put(pathname, optimizedBuffer, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_SG_READ_WRITE_TOKEN,
      contentType: extension === "svg" ? "image/svg+xml" : "image/webp",
    });

    logger.log("Logo uploaded to Blob:", blob.url);

    if (schoolId && schoolId !== "temp") {
      await db.school.update({
        where: { id: schoolId },
        data: { logo: blob.url },
      });
      logger.log("Database updated with logo for school:", schoolId);
    }

    return NextResponse.json({
      success: true,
      logoPath: blob.url,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Upload logo error:", error);
    return NextResponse.json({ error: "Gagal upload logo" }, { status: 500 });
  }
}