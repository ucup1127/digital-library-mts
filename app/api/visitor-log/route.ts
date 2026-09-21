// app/api/visitor-log/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, bookId, bookTitle, userId, userEmail, schoolId } = body;

    logger.log("📝 Received log request:", { action, bookId, bookTitle });

    if (!action) {
      return NextResponse.json({ error: "Action required" }, { status: 400 });
    }

    // 🔥 Cek session dari SERVER — bukan dari body (client bisa palsukan)
    const session = await getSession();

    // 🔥 SKIP kalau SUPER_ADMIN — aktivitasnya jangan tercatat
    if (session?.role === "SUPER_ADMIN") {
      logger.log("⏭️ Skipping log for SUPER_ADMIN");
      return NextResponse.json({ success: true, skipped: true, reason: "SUPER_ADMIN" });
    }

    // Catat ke VisitorLog (hanya untuk USER dan ADMIN biasa)
    const log = await db.visitorLog.create({
      data: {
        action: action,
        bookId: bookId || null,
        bookTitle: bookTitle || null,
        userId: userId || null,
        userEmail: userEmail || null,
        schoolId: schoolId || null,
        sessionId: "web-session",
      },
    });

    logger.log("✅ Log saved:", log.id);

    // Update views buku jika action READ
    if (action === "READ" && bookId) {
      await db.book.update({
        where: { id: bookId },
        data: { views: { increment: 1 } },
      });
      logger.log("✅ Book views updated:", bookId);
    }

    return NextResponse.json({ success: true, log });
  } catch (error) {
    logger.error("❌ Error in visitor-log:", error);
    return NextResponse.json(
      {
        error: "Failed to log activity",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}