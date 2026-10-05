// app/api/chat/unread/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    await requireAdmin();

    // Hitung pesan chat dalam 24 jam terakhir
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const count = await db.chatMessage.count({
      where: {
        createdAt: { gte: since },
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