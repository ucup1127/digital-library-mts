// app/api/admin/laporan-user/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    // 🔥 WAJIB: cek admin
    const session = await requireAdmin();

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const excludeSuperAdmin = searchParams.get("excludeSuperAdmin") === "true";

    logger.log("📊 Laporan User - schoolId:", schoolId, "excludeSuperAdmin:", excludeSuperAdmin);

    const where: any = {};

    // 🔥 Cek akses: ADMIN cuma bisa lihat sekolahnya
    if (session.role !== "SUPER_ADMIN") {
      if (session.schoolId) {
        where.schoolId = session.schoolId;
      }
    } else if (schoolId) {
      where.schoolId = schoolId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate + "T23:59:59"),
      };
    }

    if (search) {
      where.OR = [
        { userEmail: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { bookTitle: { contains: search, mode: "insensitive" } },
      ];
    }

    // 🔥 EXCLUDE SUPER_ADMIN
    if (excludeSuperAdmin) {
      where.userId = { not: null };
    }

    const totalItems = await db.visitorLog.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    const activities = await db.visitorLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    logger.log(`✅ Menemukan ${activities.length} dari ${totalItems} aktivitas`);

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
    logger.error("Error fetching user activities:", error);
    return NextResponse.json(
      { activities: [], pagination: { currentPage: 1, pageSize: 20, totalPages: 1, totalItems: 0 } },
      { status: 500 }
    );
  }
}