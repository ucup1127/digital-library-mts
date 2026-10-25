import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParts } = await params;
    const requestedPath = pathParts.join("/");

    // Sanitasi
    if (requestedPath.includes("..")) {
      return NextResponse.json({ error: "Path tidak valid" }, { status: 400 });
    }

    let blobUrl: string | null = null;

    // 🔥 Cek apakah ini URL Blob lengkap
    if (requestedPath.startsWith("http://") || requestedPath.startsWith("https://")) {
      blobUrl = requestedPath;
    } else {
      // 🔥 Fallback: cari di DB berdasarkan path lokal (data lama)
      const book = await db.book.findFirst({
        where: {
          OR: [
            { fileUrl: { endsWith: requestedPath } },
            { coverUrl: { endsWith: requestedPath } },
          ],
        },
        select: { fileUrl: true, coverUrl: true },
      });

      if (!book) {
        logger.warn("PDF tidak ditemukan di DB:", requestedPath);
        return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
      }

      if (book.fileUrl && book.fileUrl.endsWith(requestedPath)) {
        blobUrl = book.fileUrl;
      } else if (book.coverUrl && book.coverUrl.endsWith(requestedPath)) {
        blobUrl = book.coverUrl;
      }
    }

    if (!blobUrl) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
    }

    // 🔥 UBAH DI SINI: Jangan redirect, tapi ambil filenya dan stream!
    const range = request.headers.get("range");
    const fetchHeaders: HeadersInit = {};
    
    // Pass through Range header untuk PDF streaming (206 Partial Content)
    if (range) {
      fetchHeaders["Range"] = range;
    }

    const fileResponse = await fetch(blobUrl, {
      headers: fetchHeaders,
    });

    if (!fileResponse.ok && fileResponse.status !== 206) {
      logger.error("Gagal fetch file dari Blob:", fileResponse.status);
      return NextResponse.json({ error: "Gagal memuat file" }, { status: fileResponse.status });
    }

    // 🔥 Stream langsung ke browser
    const fileStream = fileResponse.body;

    const headers = new Headers();
    headers.set("Content-Type", fileResponse.headers.get("Content-Type") || "application/pdf");
    
    // 🔥 Header PENTING untuk performa
    headers.set("Cache-Control", "public, max-age=86400, immutable"); // Cache 24 jam
    headers.set("Accept-Ranges", "bytes"); // Support range request
    
    // Pass through Content-Length dan Content-Range (kalau ada)
    const contentLength = fileResponse.headers.get("Content-Length");
    if (contentLength) headers.set("Content-Length", contentLength);
    
    const contentRange = fileResponse.headers.get("Content-Range");
    if (contentRange) headers.set("Content-Range", contentRange);

    return new Response(fileStream, {
      status: fileResponse.status, // 200 atau 206
      headers,
    });

  } catch (error) {
    logger.error("Error PDF streaming:", error);
    return NextResponse.json({ error: "Gagal memuat file" }, { status: 500 });
  }
}