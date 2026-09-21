// app/api/admin/trigger-backup/route.ts
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    // 🔥 WAJIB: admin only (session)
    await requireAdmin();

    const token = process.env.BACKUP_SECRET_TOKEN;
    if (!token) {
      logger.error("BACKUP_SECRET_TOKEN tidak di-set");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      `http://localhost:${process.env.PORT || 3000}`;

    const res = await fetch(
      `${baseUrl}/api/admin/auto-backup?token=${token}`,
      { method: "GET" }
    );

    const data = await res.json();
    logger.log("Manual backup triggered by admin");
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Trigger backup error:", error);
    return NextResponse.json(
      { error: "Gagal trigger backup" },
      { status: 500 }
    );
  }
}