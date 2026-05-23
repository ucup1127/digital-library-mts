// app/api/system-log/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { level, message, stack, path, method, userId, userEmail, userAgent, ipAddress } = body;

    const log = await db.systemLog.create({
      data: {
        level: level || "ERROR",
        message,
        stack,
        path,
        method,
        userId,
        userEmail,
        userAgent,
        ipAddress,
      },
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error("Error saving log:", error);
    return NextResponse.json({ error: "Gagal menyimpan log" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (level && level !== "all") {
      where.level = level;
    }

    const [logs, total] = await Promise.all([
      db.systemLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.systemLog.count({ where }),
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
    console.error("Error fetching logs:", error);
    return NextResponse.json({ error: "Gagal mengambil log" }, { status: 500 });
  }
}