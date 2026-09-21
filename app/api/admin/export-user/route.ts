// app/api/admin/export-user/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    // 🔥 WAJIB: admin only
    const session = await requireAdmin();

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    logger.log("📊 Export User - schoolId:", schoolId);

    const where: any = {};

    // 🔥 Filter status
    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    } else {
      where.isActive = true;
    }

    // 🔥 Cek akses: ADMIN cuma lihat sekolahnya
    if (session.role !== "SUPER_ADMIN") {
      if (session.schoolId) {
        where.schoolId = session.schoolId;
      }
    } else if (schoolId) {
      where.schoolId = schoolId;
    }

    // 🔥 Exclude SUPER_ADMIN
    if (schoolId) {
      where.role = { not: "SUPER_ADMIN" };
    }

    if (role && role !== "") {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { memberId: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        className: true,
        memberId: true,
        barcode: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Format ke Excel
    const formattedData = users.map((user, index) => ({
      "No": index + 1,
      "Nama": user.name || "-",
      "Email": user.email,
      "Role": user.role,
      "Kelas": user.className || "-",
      "No Anggota": user.memberId || "-",
      "Status": user.isActive ? "Aktif" : "Nonaktif",
      "Terdaftar": new Date(user.createdAt).toLocaleDateString("id-ID"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar User");

    worksheet['!cols'] = [
      { wch: 5 },   // No
      { wch: 30 },  // Nama
      { wch: 30 },  // Email
      { wch: 12 },  // Role
      { wch: 10 },  // Kelas
      { wch: 15 },  // No Anggota
      { wch: 10 },  // Status
      { wch: 15 },  // Terdaftar
    ];

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const fileName = `daftar-user-${new Date().toISOString().split("T")[0]}.xlsx`;

    logger.log(`✅ Export user selesai - ${users.length} user`);

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
    logger.error("Export user error:", error);
    return NextResponse.json({ error: "Gagal export data" }, { status: 500 });
  }
}