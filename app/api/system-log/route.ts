// app/api/system-log/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";

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
    // 🔥 Cek admin — cuma admin yang bisa lihat system log
    const session = await requireAdmin();

    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (level && level !== "all") {
      where.level = level;
    }

    // 🔥 ADMIN biasa — jangan lihat log yang terkait SUPER_ADMIN
    if (session.role !== "SUPER_ADMIN") {
      where.NOT = {
        userEmail: {
          contains: "superadmin", // atau pakai field lain
        },
      };
      // ⚠️ Note: ini bergantung ke field userEmail — kalau ada field role, pakai itu
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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error fetching logs:", error);
    return NextResponse.json({ error: "Gagal mengambil log" }, { status: 500 });
  }
}