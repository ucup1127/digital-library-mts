// app/api/pdf/[...path]/route.ts
import { createReadStream, statSync } from "fs";
import { Readable } from "stream";
import path from "path";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// ============================================
// GET — Stream PDF dengan range request support
// ============================================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParts } = await params;

    // Gabung path, sanitasi biar nggak ada path traversal
    const requestedPath = pathParts.join("/");
    const safePath = path.normalize(requestedPath).replace(/^(\.\.[\/\\])+/, "");

    // Bangun full path
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadsDir, safePath);

    // Pastikan di dalam folder uploads
    if (!filePath.startsWith(uploadsDir)) {
      logger.warn("⚠️ Path traversal attempt:", requestedPath);
      return NextResponse.json({ error: "Path tidak valid" }, { status: 400 });
    }

    // Cek file ada
    let stat;
    try {
      stat = statSync(filePath);
    } catch {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
    }

    if (!stat.isFile()) {
      return NextResponse.json({ error: "Bukan file" }, { status: 400 });
    }

    const fileSize = stat.size;
    const contentType = safePath.endsWith(".pdf")
      ? "application/pdf"
      : "application/octet-stream";

    // ========== RANGE REQUEST ==========
    const range = request.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Validasi range
      if (isNaN(start) || isNaN(end) || start > end || end >= fileSize) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${fileSize}` },
        });
      }

      const chunkSize = end - start + 1;
      const stream = createReadStream(filePath, { start, end });

      return new NextResponse(Readable.toWeb(stream) as any, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // ========== FULL REQUEST ==========
    const stream = createReadStream(filePath);

    return new NextResponse(Readable.toWeb(stream) as any, {
      status: 200,
      headers: {
        "Content-Length": String(fileSize),
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    logger.error("Error streaming PDF:", error);
    return NextResponse.json({ error: "Gagal memuat file" }, { status: 500 });
  }
}