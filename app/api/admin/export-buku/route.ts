// app/api/admin/export-buku/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    // 🔥 WAJIB: admin only
    await requireAdmin();

    const books = await db.book.findMany({
      include: {
        categories: { include: { category: true } },
        school: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedData = books.map((book, index) => ({
      "No": index + 1,
      "Judul Buku": book.title,
      "Penulis": book.author,
      "Kategori": book.categories.map((c) => c.category.name).join(", "),
      "Tahun": book.year || "-",
      "Jumlah Dilihat": book.views,
      "Tanggal Ditambahkan": new Date(book.createdAt).toLocaleDateString(),
      "Link File": book.fileUrl || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 40 },
      { wch: 25 },
      { wch: 30 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 50 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Buku");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="daftar-buku-${new Date().toISOString().split("T")[0]}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Export error:", error);
    return NextResponse.json({ error: "Gagal mengexport data" }, { status: 500 });
  }
}