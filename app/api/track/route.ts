// app/api/track/route.ts
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    // 🔥 SKIP kalau SUPER_ADMIN
    if (session?.role === "SUPER_ADMIN") {
      return NextResponse.json({ success: true, skipped: true });
    }

    const body = await request.json();
    const { path, userAgent, ip } = body;

    let action = "view_page";
    let bookId: string | null = null;
    let bookTitle: string | null = null;

    // Extract book ID dari path
    const bookMatch = path?.match(/\/katalog\/([^\/]+)/);
    if (bookMatch) {
      action = "view_book";
      const extractedId = bookMatch[1];  // ← FIX
      bookId = extractedId;

      try {
        const book = await db.book.findUnique({
          where: { id: extractedId },  // ← FIX
          select: { title: true },
        });
        bookTitle = book?.title || null;
      } catch (err) {
        logger.error("Error fetching book:", err);
      }
    }

    // Simpan log
    try {
      await db.visitorLog.create({
        data: {
          action,
          bookId,
          bookTitle,
          ipAddress: ip || request.headers.get("x-forwarded-for") || "unknown",
          userAgent: userAgent || request.headers.get("user-agent") || "unknown",
          sessionId: request.cookies.get("session-id")?.value || "unknown",
          createdAt: new Date(),
        },
      });
    } catch (err) {
      logger.error("Error saving visitor log:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Track API error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}