// app/api/pdf/[...path]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// ============================================
// GET — Redirect ke Vercel Blob URL
// Frontend panggil /api/pdf/uploads/books/xxx.pdf
// Route ini cari di DB, redirect ke URL Blob asli
// ============================================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParts } = await params;
    const requestedPath = pathParts.join("/"); // contoh: "uploads/books/xxx.pdf"

    // Sanitasi: cegah path traversal
    if (requestedPath.includes("..")) {
      return NextResponse.json({ error: "Path tidak valid" }, { status: 400 });
    }

    // Cari book yang fileUrl / coverUrl-nya berakhir dengan requestedPath
    const book = await db.book.findFirst({
      where: {
        OR: [
          { fileUrl: { endsWith: requestedPath } },
          { coverUrl: { endsWith: requestedPath } },
        ],
      },
      select: {
        fileUrl: true,
        coverUrl: true,
      },
    });

    if (!book) {
      logger.warn("PDF route: file tidak ditemukan di DB:", requestedPath);
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
    }

    // Tentukan URL Blob yang cocok
    let blobUrl: string | null = null;
    if (book.fileUrl && book.fileUrl.endsWith(requestedPath)) {
      blobUrl = book.fileUrl;
    } else if (book.coverUrl && book.coverUrl.endsWith(requestedPath)) {
      blobUrl = book.coverUrl;
    }

    if (!blobUrl) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
    }

    // Redirect ke URL Blob (302 sementara, biar browser handle range request sendiri)
    return NextResponse.redirect(blobUrl, 302);
  } catch (error) {
    logger.error("Error PDF redirect:", error);
    return NextResponse.json({ error: "Gagal memuat file" }, { status: 500 });
  }
}