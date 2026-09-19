// app/api/admin/activity-logs/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // 🔥 Cek session dari server — bukan dari header
    const session = await requireAdmin();

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const action = searchParams.get("action");
    const date = searchParams.get("date");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    console.log("📋 GET Activity Logs - role:", session.role, "schoolId:", schoolId);

    const where: any = {};

    // ========== ATURAN AKSES BERDASARKAN ROLE ==========

    if (session.role === "SUPER_ADMIN") {
      // SUPER_ADMIN: bisa lihat semua log
      if (schoolId && schoolId !== "") {
        where.schoolId = schoolId;
      }
    } else if (session.role === "ADMIN") {
      // ADMIN: hanya bisa lihat log di sekolahnya sendiri
      if (session.schoolId) {
        where.schoolId = session.schoolId;
      }
      // 🔥 ADMIN TIDAK BOLEH lihat log SUPER_ADMIN
      where.adminRole = { not: "SUPER_ADMIN" };
    } else {
      return NextResponse.json(
        { activities: [], pagination: { currentPage: 1, pageSize: 20, totalPages: 1, totalItems: 0 } },
        { status: 403 }
      );
    }

    // Filter berdasarkan aksi
    if (action && action !== "") {
      where.action = action;
    }

    // Filter berdasarkan tanggal
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = { gte: startDate, lte: endDate };
    }

    // Filter pencarian
    if (search) {
      where.OR = [
        { adminName: { contains: search, mode: "insensitive" } },
        { adminEmail: { contains: search, mode: "insensitive" } },
        { targetName: { contains: search, mode: "insensitive" } },
      ];
    }

    const totalItems = await db.adminLog.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    const activities = await db.adminLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    console.log(`✅ Menemukan ${activities.length} dari ${totalItems} aktivitas`);

    return NextResponse.json({
      activities,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalPages,
        totalItems,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { activities: [], pagination: { currentPage: 1, pageSize: 20, totalPages: 1, totalItems: 0 } },
      { status: 500 }
    );
  }
}