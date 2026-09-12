// app/api/admin-log/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // 🔥 Ambil user dari session server — bukan dari body
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, targetType, targetId, targetName, changes } = body;

    if (!action || !targetType) {
      return NextResponse.json(
        { error: "action dan targetType wajib diisi" },
        { status: 400 }
      );
    }

    const log = await db.adminLog.create({
      data: {
        adminId: session.userId,
        adminName: session.name || "Unknown",
        adminEmail: session.email,
        adminRole: session.role,
        schoolId: session.schoolId,
        action,
        targetType,
        targetId,
        targetName,
        changes: changes || {},
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
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