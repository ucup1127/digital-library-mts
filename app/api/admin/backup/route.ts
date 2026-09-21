// app/api/admin/backup/route.ts
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { getAllBackupData } from "@/lib/backup-data";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    // 🔥 WAJIB: admin only (session)
    await requireAdmin();

    const database = await getAllBackupData();

    const backupData = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      database,
    };

    logger.log("Backup created by admin");

    return NextResponse.json(backupData);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Backup error:", error);
    return NextResponse.json(
      { error: "Gagal membuat backup" },
      { status: 500 }
    );
  }
}