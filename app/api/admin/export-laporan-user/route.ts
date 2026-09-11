// app/api/admin/export-laporan-user/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");
    const search = searchParams.get("search") || "";
    const excludeSuperAdmin = searchParams.get("excludeSuperAdmin") === "true";
    
    console.log("📊 Export Laporan User - schoolId:", schoolId);
    
    if (!schoolId) {
      return NextResponse.json({ error: "School ID diperlukan" }, { status: 400 });
    }
    
    const where: any = {};
    
    if (schoolId) {
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
    
    const activities = await db.visitorLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    
    // Format data untuk Excel
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
    
    // Adjust column widths
    const colWidths = [
      { wch: 6 },   // No
      { wch: 22 },  // Waktu
      { wch: 30 },  // User Email
      { wch: 15 },  // Aktivitas
      { wch: 40 },  // Judul Buku
      { wch: 18 },  // IP Address
    ];
    worksheet['!cols'] = colWidths;
    
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
    console.error("Export error:", error);
    return NextResponse.json({ error: "Gagal export data" }, { status: 500 });
  }
}