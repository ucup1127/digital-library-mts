// app/api/admin/export-buku-fisik-excel/route.ts
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
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { judul: { contains: search, mode: "insensitive" } },
        { penulis: { contains: search, mode: "insensitive" } },
        { isbn: { contains: search, mode: "insensitive" } },
      ];
    }

    const bukuFisik = await db.bukuFisik.findMany({
      where,
      orderBy: { judul: "asc" },
    });

    const formattedData = bukuFisik.map((book, index) => ({
      "No": index + 1,
      "Barcode": book.barcode,
      "Judul Buku": book.judul,
      "Penulis": book.penulis,
      "Penerbit": book.penerbit || "-",
      "Tahun": book.tahun || "-",
      "ISBN": book.isbn || "-",
      "Lokasi Rak": book.lokasiRak || "-",
      "Stok": book.stok,
      "Stok Tersedia": book.stokTersedia,
      "Kondisi": book.kondisi,
      "Deskripsi": book.deskripsi || "-",
      "Tanggal Ditambahkan": new Date(book.createdAt).toLocaleDateString("id-ID"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Buku Fisik");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="buku-fisik-${new Date().toISOString().split("T")[0]}.xlsx"`,
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