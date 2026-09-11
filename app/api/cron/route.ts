// app/api/cron/check-overdue/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  
  // Proteksi dengan secret key
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/peminjaman-fisik/check-overdue`);
  const data = await res.json();
  
  return NextResponse.json(data);
}