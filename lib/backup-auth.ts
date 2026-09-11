// lib/backup-auth.ts
import { NextResponse } from "next/server";

/**
 * Cek token backup. Return NextResponse kalau gagal, null kalau OK.
 * 
 * PENTING: Kalau BACKUP_SECRET_TOKEN nggak di-set, TOLAK semua request.
 * (Bukan justru izinkan semua.)
 */
export function requireBackupToken(request: Request): NextResponse | null {
  const expectedToken = process.env.BACKUP_SECRET_TOKEN;
  
  // Kalau token nggak di-set di server → tolak semua
  if (!expectedToken) {
    console.error("❌ BACKUP_SECRET_TOKEN tidak di-set di environment!");
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }
  
  // Ambil token dari query string ATAU header
  const url = new URL(request.url);
  const token =
    url.searchParams.get("token") ||
    request.headers.get("x-backup-token");
  
  if (token !== expectedToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  return null; // OK, lanjut
}