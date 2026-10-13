// app/api/upload/route.ts
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import sharp from "sharp";

/**
 * Optimasi gambar dengan sharp
 * - Resize ke max width/height
 * - Convert ke WebP (lebih kecil dari JPEG/PNG)
 * - Compress dengan quality 80
 */
async function optimizeImage(
  buffer: Buffer,
  type: string
): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
  let maxWidth = 800;
  let maxHeight = 1200;

  // Cover buku: rasio 2:3, max 400x600
  if (type === "cover") {
    maxWidth = 400;
    maxHeight = 600;
  }
  // Logo: max 200x200
  else if (type === "logo") {
    maxWidth = 200;
    maxHeight = 200;
  }
  // Gallery: max 1200x1200
  else if (type === "gallery") {
    maxWidth = 1200;
    maxHeight = 1200;
  }

  const optimized = await sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true, // jangan perbesar gambar kecil
    })
    .webp({ quality: 80 })
    .toBuffer();

  return {
    buffer: optimized,
    ext: "webp",
    contentType: "image/webp",
  };
}

export async function POST(request: Request) {
  try {
    await requireAuth();
    logger.log("📤 Upload API called");

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    logger.log("File:", file?.name, "Type:", type, "Size:", file?.size);

    if (!file) {
      return NextResponse.json(
        { error: "Tidak ada file yang diupload" },
        { status: 400 }
      );
    }

    // Validasi tipe file berdasarkan `type`
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (type === "book") {
      // ⚠️ PDF > 4.5MB tidak bisa lewat server. Harus pakai client upload.
      return NextResponse.json(
        {
          error:
            "Upload PDF harus pakai client upload. Gunakan endpoint /api/upload/client",
        },
        { status: 400 }
      );
    } else {
      if (!isImage) {
        return NextResponse.json(
          { error: "Hanya file gambar yang diperbolehkan" },
          { status: 400 }
        );
      }
      if (file.size > 4 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Ukuran file maksimal 4MB" },
          { status: 400 }
        );
      }
    }

    // Tentukan folder di Blob
    let folder = "gallery";
    if (type === "cover") folder = "covers";
    else if (type === "gallery") folder = "gallery";
    else if (type === "logo") folder = "logos";

    // ✅ OPTIMASI GAMBAR dengan sharp
    let optimizedBuffer: Buffer;
    let ext = "webp";
    let contentType = "image/webp";

    try {
      const arrayBuffer = await file.arrayBuffer();
      const originalBuffer = Buffer.from(arrayBuffer);
      const result = await optimizeImage(originalBuffer, type);
      optimizedBuffer = result.buffer;
      ext = result.ext;
      contentType = result.contentType;

      const originalSize = file.size;
      const optimizedSize = optimizedBuffer.length;
      const saved = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

      logger.log(
        `✅ Image optimized: ${originalSize} → ${optimizedSize} bytes (saved ${saved}%)`
      );
    } catch (sharpError) {
      logger.error("Sharp optimization failed, fallback to original:", sharpError);
      // Fallback: upload file asli kalau sharp gagal
      const arrayBuffer = await file.arrayBuffer();
      optimizedBuffer = Buffer.from(arrayBuffer);
      ext = file.name.split(".").pop() || "bin";
      contentType = file.type;
    }

    // Generate nama file unik
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const pathname = `${folder}/${timestamp}_${random}.${ext}`;

    // Upload ke Vercel Blob
    const blob = await put(pathname, optimizedBuffer, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_SG_READ_WRITE_TOKEN,
      contentType,
    });

    logger.log("✅ File uploaded to Blob:", blob.url);

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error("Upload error:", error);
    return NextResponse.json({ error: "Upload gagal" }, { status: 500 });
  }
}

// OPTIONS (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin":
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}