// app/api/admin-log/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";

// ============================================
// SCHEMA — POST
// ============================================
const adminLogSchema = z.object({
  action: z.string().min(1).max(50),
  targetType: z.string().min(1).max(50),
  targetId: z.string().optional().nullable(),
  targetName: z.string().max(255).optional().nullable(),
  changes: z.any().optional(),
});

// ============================================
// SCHEMA — GET (query params)
// ============================================
const getLogsSchema = z.object({
  action: z.string().default("all"),
  targetType: z.string().default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// GET — Ambil daftar log (buat halaman admin-log)
// ============================================
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const parseResult = getLogsSchema.safeParse({
      action: searchParams.get("action") ?? "all",
      targetType: searchParams.get("targetType") ?? "all",
      page: searchParams.get("page") ?? "1",
      limit: searchParams.get("limit") ?? "20",
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Query tidak valid" },
        { status: 400 }
      );
    }

    const { action, targetType, page, limit } = parseResult.data;

    // Bangun filter
    const where: any = {};
    if (action !== "all") where.action = action;
    if (targetType !== "all") where.targetType = targetType;

    // Hitung total + ambil data (paralel)
    const [totalItems, logs] = await Promise.all([
      db.adminLog.count({ where }),
      db.adminLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      logs,
      totalItems,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error("Admin log GET error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil log" },
      { status: 500 }
    );
  }
}

// ============================================
// POST — Simpan log baru (dari client)
// ============================================
export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json();

    // 🔥 Validasi input
    const parseResult = adminLogSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Data tidak valid" },
        { status: 400 }
      );
    }

    const { action, targetType, targetId, targetName, changes } = parseResult.data;

    // 🔥 Ambil IP + user-agent dari request
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;

    // 🔥 Simpan ke DB — lengkapi 6 field wajib dari session
    const log = await db.adminLog.create({
      data: {
        adminId: session.userId,
        adminName: session.name ?? "Unknown",
        adminEmail: session.email ?? "",
        adminRole: session.role,
        schoolId: session.schoolId,
        action,
        targetType,
        targetId: targetId ?? null,
        targetName: targetName ?? null,
        changes: changes ?? undefined,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ success: true, id: log.id });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error("Admin log error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan log" },
      { status: 500 }
    );
  }
}