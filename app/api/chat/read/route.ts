// app/api/chat/read/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

// 🔥 Mark chat as read — update lastReadAt user
export async function POST() {
  try {
    const session = await requireAdmin();

    await db.chatReadState.upsert({
      where: { userId: session.userId },
      update: { lastReadAt: new Date() },
      create: { userId: session.userId, lastReadAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Chat read error:", error);
    return NextResponse.json({ error: "Gagal" }, { status: 500 });
  }
}