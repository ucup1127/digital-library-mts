// app/api/admin/export-activity-logs/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    // 🔥 WAJIB: admin only
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const action = searchParams.get("action");
    const date = searchParams.get("date");
    const search = searchParams.get("search") || "";

    logger.log("📊 Export Excel - schoolId:", schoolId);

    const where: any = {};

    if (schoolId && schoolId !== "") where.schoolId = schoolId;
    if (action && action !== "") where.action = action;

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = { gte: startDate, lte: endDate };
    }

    if (search) {
      where.OR = [
        { adminName: { contains: search, mode: "insensitive" } },
        { adminEmail: { contains: search, mode: "insensitive" } },
        { targetName: { contains: search, mode: "insensitive" } },
      ];
    }

    const activities = await db.adminLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const excelData = activities.map((log, index) => {
      let changesText = "-";
      if (log.changes) {
        try {
          const changes = typeof log.changes === "string" ? JSON.parse(log.changes) : log.changes;
          changesText = JSON.stringify(changes);
        } catch {
          changesText = String(log.changes);
        }
      }

      return {
        "No": index + 1,
        "Waktu": new Date(log.createdAt).toLocaleString("id-ID"),
        "Admin": log.adminName,
        "Email": log.adminEmail,
        "Aksi": log.action,
        "Tipe Target": log.targetType,
        "Target": log.targetName || "-",
        "Perubahan": changesText,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Aktivitas Admin");

    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 20 },
      { wch: 25 },
      { wch: 30 },
      { wch: 12 },
      { wch: 15 },
      { wch: 30 },
      { wch: 50 },
    ];

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const fileName = `laporan-aktivitas-admin-${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Export error:", error);
    return NextResponse.json({ error: "Gagal export data" }, { status: 500 });
  }
}