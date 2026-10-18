// app/api/admin/laporan-user/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const session = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const excludeSuperAdmin = searchParams.get("excludeSuperAdmin") === "true";

    const where: any = {};

    if (session.role !== "SUPER_ADMIN") {
      if (session.schoolId) where.schoolId = session.schoolId;
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

    if (excludeSuperAdmin) {
      where.userId = { not: null };
    }

    const skip = (page - 1) * limit;

    // 1. Ambil Log
    const [totalItems, activities] = await Promise.all([
      db.visitorLog.count({ where }),
      db.visitorLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    // 2. 🔥 Ambil Nama User secara terpisah (tanpa relasi Prisma)
    const userIds = activities.map(a => a.userId).filter(id => id !== null) as string[];
    let userMap: Record<string, string> = {};
    
    if (userIds.length > 0) {
      const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true }
      });
      users.forEach(u => { 
        userMap[u.id] = u.name || u.email || "User Tanpa Nama"; 
      });
    }

    // 3. Gabungkan
    const activitiesWithNames = activities.map(activity => ({
      ...activity,
      userName: activity.userId ? userMap[activity.userId] : null
    }));

    // 4. Hitung Statistik
    const uniqueUsersRaw = await db.visitorLog.groupBy({ by: ['userId'], where });
    const uniqueBooksRaw = await db.visitorLog.groupBy({ by: ['bookId'], where });
    const todayCount = await db.visitorLog.count({ 
      where: { ...where, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } 
    });

    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      activities: activitiesWithNames,
      pagination: { currentPage: page, pageSize: limit, totalPages, totalItems },
      stats: { uniqueUsers: uniqueUsersRaw.length, uniqueBooks: uniqueBooksRaw.length, todayCount }
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error fetching user activities:", error);
    return NextResponse.json(
      { activities: [], pagination: { currentPage: 1, pageSize: 20, totalPages: 1, totalItems: 0 }, stats: { uniqueUsers: 0, uniqueBooks: 0, todayCount: 0 } },
      { status: 500 }
    );
  }
}