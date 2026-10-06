// app/api/admin/users/import/template/route.ts
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    await requireAdmin();

    // Dynamic import xlsx
    const XLSX = await import("xlsx");

    // Data contoh
    const template = [
      {
        nama: "Ahmad Fauzi",
        username: "ahmad_fauzi",
        nisn: "1234567890",
        kelas: "7A",
        role: "USER",
        email: "",
      },
      {
        nama: "Siti Aminah",
        username: "siti_aminah",
        nisn: "0987654321",
        kelas: "8B",
        role: "USER",
        email: "",
      },
      {
        nama: "Pak Budi Santoso",
        username: "pak_budi",
        nisn: "",
        kelas: "",
        role: "ADMIN",
        email: "budi@mts.sch.id",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 25 }, // nama
      { wch: 20 }, // username
      { wch: 15 }, // nisn
      { wch: 10 }, // kelas
      { wch: 10 }, // role
      { wch: 30 }, // email
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template User");

    // Info sheet
    const infoSheet = XLSX.utils.aoa_to_sheet([
      ["PETUNJUK PENGISIAN TEMPLATE"],
      [""],
      ["Kolom:", "Keterangan:"],
      ["nama", "Wajib. Nama lengkap user"],
      ["username", "Wajib. 4-20 karakter, hanya huruf kecil, angka, underscore"],
      ["nisn", "Wajib untuk role USER. 10 digit angka"],
      ["kelas", "Wajib untuk role USER. Contoh: 7A, 8B, 9C"],
      ["role", "USER atau ADMIN"],
      ["email", "Opsional untuk USER, Wajib untuk ADMIN"],
      [""],
      ["CATATAN:"],
      ["- Username harus unik (tidak boleh sama dengan user lain)"],
      ["- NISN harus unik (tidak boleh sama dengan user lain)"],
      ["- Email harus unik kalau diisi"],
      ["- Password akan di-generate otomatis (8 karakter)"],
      ["- Password akan ditampilkan setelah import berhasil"],
    ]);
    infoSheet["!cols"] = [{ wch: 20 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, infoSheet, "Petunjuk");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="template-import-user.xlsx"`,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Template download error:", error);
    return NextResponse.json({ error: "Gagal download template" }, { status: 500 });
  }
}