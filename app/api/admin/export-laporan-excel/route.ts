// app/api/admin/export-laporan-excel/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");
    
    let where: any = {};
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate + "T23:59:59"),
      };
    }
    
    const activities = await db.visitorLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    
    const formattedData = activities.map((activity, index) => ({
      "No": index + 1,
      "Waktu": new Date(activity.createdAt).toLocaleString("id-ID"),
      "User Email": activity.userEmail || "Guest",
      "Aktivitas": activity.action,
      "Konten": activity.bookTitle || activity.categoryId || "-",
      "IP Address": activity.ipAddress || "-",
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Aktivitas");
    
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    
    const fileName = `laporan-aktivitas-${new Date().toISOString().split("T")[0]}.xlsx`;
    
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