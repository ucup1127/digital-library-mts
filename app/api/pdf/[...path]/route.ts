// app/api/pdf/[...path]/route.ts
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

    // 🔥 Kalau requestedPath adalah URL Blob lengkap, redirect langsung
    if (requestedPath.startsWith("http://") || requestedPath.startsWith("https://")) {
      logger.log("Redirect PDF ke URL Blob langsung:", requestedPath);
      return NextResponse.redirect(requestedPath, 302);
    }

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

    let blobUrl: string | null = null;
    if (book.fileUrl && book.fileUrl.endsWith(requestedPath)) {
      blobUrl = book.fileUrl;
    } else if (book.coverUrl && book.coverUrl.endsWith(requestedPath)) {
      blobUrl = book.coverUrl;
    }

    if (!blobUrl) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.redirect(blobUrl, 302);
  } catch (error) {
    logger.error("Error PDF redirect:", error);
    return NextResponse.json({ error: "Gagal memuat file" }, { status: 500 });
  }
}