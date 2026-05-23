// app/api/notifications/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lastCheck = searchParams.get("lastCheck");
    
    const where: any = {};
    
    if (lastCheck) {
      where.createdAt = { gt: new Date(lastCheck) };
    }
    
    // ✅ HAPUS filter schoolId dari VisitorLog
    const [newBooks, newUsers, newActivities] = await Promise.all([
      db.book.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, author: true, createdAt: true }
      }),
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true }
      }),
      db.visitorLog.findMany({
        where: { ...where, action: "READ" }, // ✅ Hapus schoolId dari sini
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, userEmail: true, bookTitle: true, createdAt: true }
      })
    ]);
    
    return NextResponse.json({
      newBooks,
      newUsers,
      newActivities,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Gagal mengambil notifikasi" }, { status: 500 });
  }
}