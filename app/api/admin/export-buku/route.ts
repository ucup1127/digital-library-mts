// app/api/admin/export-buku/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    // Ambil semua data buku
    const books = await db.book.findMany({
      include: {
        categories: {
          include: { category: true }
        },
        school: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format data untuk Excel
    const formattedData = books.map((book, index) => ({
      "No": index + 1,
      "Judul Buku": book.title,
      "Penulis": book.author,
      "Kategori": book.categories.map(c => c.category.name).join(", "),
      "Tahun": book.year || "-",
      "Jumlah Dilihat": book.views,
      "Tanggal Ditambahkan": new Date(book.createdAt).toLocaleDateString(),
      "Link File": book.fileUrl || "-",
    }));

    // Buat worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // Atur lebar kolom
    worksheet['!cols'] = [
      { wch: 5 },   // No
      { wch: 40 },  // Judul
      { wch: 25 },  // Penulis
      { wch: 30 },  // Kategori
      { wch: 10 },  // Tahun
      { wch: 15 },  // Dilihat
      { wch: 15 },  // Tanggal
      { wch: 50 },  // Link
    ];

    // Buat workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Buku");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Return file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="daftar-buku-${new Date().toISOString().split('T')[0]}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Gagal mengexport data" },
      { status: 500 }
    );
  }
}