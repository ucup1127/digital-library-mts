// app/api/admin/export-laporan-user/route.ts
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
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");
    const search = searchParams.get("search") || "";
    const excludeSuperAdmin = searchParams.get("excludeSuperAdmin") === "true";

    logger.log("📊 Export Laporan User - schoolId:", schoolId);

    if (!schoolId) {
      return NextResponse.json({ error: "School ID diperlukan" }, { status: 400 });
    }

    const where: any = { schoolId };

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

    const activities = await db.visitorLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const excelData = activities.map((activity, index) => ({
      "No": index + 1,
      "Waktu": new Date(activity.createdAt).toLocaleString("id-ID"),
      "User Email": activity.userEmail || "Guest",
      "Aktivitas": activity.action,
      "Judul Buku": activity.bookTitle || "-",
      "IP Address": activity.ipAddress || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Aktivitas Siswa");

    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 30 },
      { wch: 15 },
      { wch: 40 },
      { wch: 18 },
    ];

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const fileName = `laporan-aktivitas-siswa-${new Date().toISOString().split("T")[0]}.xlsx`;

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