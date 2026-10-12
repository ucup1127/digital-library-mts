// app/api/upload/route.ts
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

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

    // Generate nama file unik
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ext = file.name.split(".").pop() || "bin";
    const pathname = `${folder}/${timestamp}_${random}.${ext}`;

    // Upload ke Vercel Blob (private)
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
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