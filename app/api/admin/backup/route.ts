// app/api/admin/backup/route.ts
import { NextResponse } from "next/server";
import { requireBackupToken } from "@/lib/backup-auth";
import { getAllBackupData } from "@/lib/backup-data";

export async function GET(request: Request) {
  // Cek token
  const authError = requireBackupToken(request);
  if (authError) return authError;

  try {
    const database = await getAllBackupData();

    const backupData = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      database,
    };

    return NextResponse.json(backupData);
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json(
      { error: "Gagal membuat backup" },
      { status: 500 }
    );
  }
}