// app/api/admin/import-buku/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const schoolId = formData.get("schoolId") as string;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    if (!schoolId) {
      return NextResponse.json({ error: "Sekolah harus dipilih" }, { status: 400 });
    }

    // Baca file Excel
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json({ error: "File Excel kosong" }, { status: 400 });
    }

    // Ambil semua kategori yang ada di database
    const existingCategories = await db.category.findMany();
    const categoryMap = new Map(existingCategories.map(c => [c.name.toLowerCase(), c.id]));

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Proses setiap baris
    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      
      // Mapping kolom (support multiple column names)
      const title = row["Judul"] || row["Judul Buku"] || row["title"];
      const author = row["Penulis"] || row["author"];
      const categoryNames = row["Kategori"] || row["category"];
      const year = row["Tahun"] || row["year"];
      const description = row["Deskripsi"] || row["description"];
      const coverUrl = row["Cover URL"] || row["coverUrl"] || null;
      const fileUrl = row["File URL"] || row["fileUrl"] || null;

      // Validasi required field
      if (!title || !author) {
        errors.push(`Baris ${i + 2}: Judul dan Penulis wajib diisi`);
        errorCount++;
        continue;
      }

      try {
        // Buat buku baru
        const book = await db.book.create({
          data: {
            title,
            author,
            year: year || null,
            description: description || null,
            coverUrl: coverUrl || null,
            fileUrl: fileUrl || null,
            schoolId,
          },
        });

        // Proses kategori
        if (categoryNames) {
          const categoryList = categoryNames.split(",").map((cat: string) => cat.trim().toLowerCase());
          
          for (const catName of categoryList) {
            let categoryId = categoryMap.get(catName);
            
            // Jika kategori belum ada, buat baru
            if (!categoryId) {
              const newCategory = await db.category.create({
                data: { name: catName },
              });
              categoryId = newCategory.id;
              categoryMap.set(catName, categoryId);
            }
            
            // Hubungkan buku dengan kategori
            await db.bookCategory.create({
              data: {
                bookId: book.id,
                categoryId,
              },
            });
          }
        }
        
        successCount++;
      } catch (error) {
        errors.push(`Baris ${i + 2}: Gagal import - ${(error as Error).message}`);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import selesai! ${successCount} buku berhasil ditambahkan, ${errorCount} gagal.`,
      successCount,
      errorCount,
      errors: errors.slice(0, 10), // Kirim maksimal 10 error
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Gagal import file" }, { status: 500 });
  }
}