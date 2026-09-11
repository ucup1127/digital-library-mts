// app/api/admin/activity-logs/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const action = searchParams.get("action");
    const date = searchParams.get("date");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    
    // Ambil role dari header
    const userRole = request.headers.get("x-user-role") || "";
    const userSchoolId = request.headers.get("x-school-id") || "";
    
    console.log("📋 GET Activity Logs - userRole:", userRole, "schoolId:", schoolId);
    
    const where: any = {};
    
    // ========== ATURAN AKSES BERDASARKAN ROLE ==========
    
    if (userRole === "SUPER_ADMIN") {
      // SUPER_ADMIN: bisa lihat semua log, bisa filter berdasarkan schoolId
      if (schoolId && schoolId !== "") {
        where.schoolId = schoolId;
      }
      // SUPER_ADMIN bisa lihat log dengan schoolId null (aktivitas sendiri)
      // Tidak perlu filter tambahan
    } 
    else if (userRole === "ADMIN") {
      // ADMIN: hanya bisa lihat log di sekolahnya sendiri
      // dan hanya untuk USER (siswa) - exclude admin dan SUPER_ADMIN
      if (userSchoolId) {
        where.schoolId = userSchoolId;
      }
      // ADMIN tidak boleh melihat log admin lain atau SUPER_ADMIN
      where.adminRole = "ADMIN"; // Atau bisa juga exclude SUPER_ADMIN
      // Alternative: where.adminRole: { not: "SUPER_ADMIN" }
    }
    else {
      // Role lain tidak diizinkan
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
    
    // Hitung total data
    const totalItems = await db.adminLog.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;
    
    // Ambil data
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
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { activities: [], pagination: { currentPage: 1, pageSize: 20, totalPages: 1, totalItems: 0 } },
      { status: 500 }
    );
  }
}