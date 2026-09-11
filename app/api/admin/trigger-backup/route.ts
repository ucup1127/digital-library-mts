// app/api/admin/trigger-backup/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  // TODO Fase 1: cek session admin di sini
  // Untuk sekarang, endpoint ini masih terbuka — nanti diperbaiki

  const token = process.env.BACKUP_SECRET_TOKEN;
  if (!token) {
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
  return NextResponse.json(data, { status: res.status });
}