// app/api/notifications/[id]/read/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const notif = await db.notification.findUnique({ where: { id } });

    if (!notif || notif.userId !== session.userId) {
      return NextResponse.json({ error: "Notifikasi tidak ditemukan" }, { status: 404 });
    }

    await db.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error marking notification:", error);
    return NextResponse.json({ error: "Gagal update notifikasi" }, { status: 500 });
  }
}