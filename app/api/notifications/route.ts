// app/api/notifications/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          link: true,
          isRead: true,
          createdAt: true,
        },
      }),
      db.notification.count({
        where: { userId: session.userId, isRead: false },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error fetching notifications:", error);
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 500 });
  }
}

// Mark all as read
export async function PUT() {
  try {
    const session = await requireAuth();
    await db.notification.updateMany({
      where: { userId: session.userId, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error marking notifications:", error);
    return NextResponse.json({ error: "Gagal update notifikasi" }, { status: 500 });
  }
}