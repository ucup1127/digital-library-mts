// app/api/chat/unread/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await requireAdmin();

    // 🔥 Ambil lastReadAt user
    const readState = await db.chatReadState.findUnique({
      where: { userId: session.userId },
      select: { lastReadAt: true },
    });

    // Kalau belum ada state → hitung dari awal
    const since = readState?.lastReadAt || new Date(0);

    // Hitung pesan SETELAH lastReadAt DAN bukan dari user sendiri
    const count = await db.chatMessage.count({
      where: {
        createdAt: { gt: since },
        userId: { not: session.userId },
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Chat unread error:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}