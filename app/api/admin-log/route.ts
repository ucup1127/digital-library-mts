// app/api/admin-log/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminId, adminName, adminEmail, adminRole, schoolId, action, targetType, targetId, targetName, changes, ipAddress, userAgent } = body;

    const log = await db.adminLog.create({
      data: {
        adminId,
        adminName,
        adminEmail,
        adminRole,
        schoolId,
        action,
        targetType,
        targetId,
        targetName,
        changes: changes || {},
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error("Error saving admin log:", error);
    return NextResponse.json({ error: "Gagal menyimpan log" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const targetType = searchParams.get("targetType");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action && action !== "all") where.action = action;
    if (targetType && targetType !== "all") where.targetType = targetType;

    const [logs, total] = await Promise.all([
      db.adminLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.adminLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error("Error fetching admin logs:", error);
    return NextResponse.json({ error: "Gagal mengambil log" }, { status: 500 });
  }
}