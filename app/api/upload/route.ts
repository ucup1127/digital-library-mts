// app/api/upload/route.ts
import { writeFile, mkdir } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { requireAuth, AuthError } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await requireAuth();
    console.log("📤 Upload API called");

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    console.log("File:", file?.name, "Type:", type, "Size:", file?.size);

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
      if (!isPdf) {
        return NextResponse.json(
          { error: "File buku harus berformat PDF" },
          { status: 400 }
        );
      }
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Ukuran file PDF maksimal 50MB" },
          { status: 400 }
        );
      }
    } else {
      if (!isImage) {
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
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Tentukan folder
    let folder = "gallery";
    if (type === "cover") folder = "covers";
    else if (type === "book") folder = "books";
    else if (type === "gallery") folder = "gallery";
    else if (type === "logo") folder = "logos";

    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

    await mkdir(uploadDir, { recursive: true });

    // 🔥 Sanitasi nama file — cegah path traversal
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ext = path.extname(file.name);
    const safeName = `${timestamp}_${random}${ext}`;
    const filePath = path.join(uploadDir, safeName);

    // 🔥 Pastikan di dalam folder uploads
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!filePath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: "Path tidak valid" }, { status: 400 });
    }

    const publicPath = `/uploads/${folder}/${safeName}`;

    await writeFile(filePath, buffer);

    console.log("✅ File saved:", publicPath);

    return NextResponse.json({ success: true, url: publicPath });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload gagal: " + String(error) },
      { status: 500 }
    );
  }
}

// OPTIONS (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}