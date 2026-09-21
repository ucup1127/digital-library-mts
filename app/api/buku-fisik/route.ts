// app/api/buku-fisik/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

// GET - Ambil daftar buku fisik dengan pagination dan filter schoolId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    logger.log("📚 GET Buku Fisik - schoolId:", schoolId, "page:", page, "limit:", limit);
    
    const where: any = {};
    
    // Filter berdasarkan schoolId
    if (schoolId && schoolId !== "") {
      where.schoolId = schoolId;
    } else {
      // Jika tidak ada schoolId, return empty (untuk SUPER_ADMIN yang belum pilih sekolah)
      return NextResponse.json({
        books: [],
        pagination: { currentPage: page, pageSize: limit, totalPages: 1, totalItems: 0 },
      });
    }
    
    // Filter pencarian
    if (search) {
      where.OR = [
        { judul: { contains: search, mode: "insensitive" } },
        { penulis: { contains: search, mode: "insensitive" } },
        { isbn: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }
    
    // Hitung total data
    const totalItems = await db.bukuFisik.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;
    
    // Ambil data dengan pagination
    const bukuFisik = await db.bukuFisik.findMany({
      where,
      orderBy: { judul: "asc" },
      skip,
      take: limit,
    });
    
   logger.log(`✅ Menemukan ${bukuFisik.length} dari ${totalItems} buku`);
    
    return NextResponse.json({
      books: bukuFisik,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalPages,
        totalItems,
      },
    });
  } catch (error) {
    logger.error("Error fetching buku fisik:", error);
    return NextResponse.json(
      { books: [], pagination: { currentPage: 1, pageSize: 10, totalPages: 1, totalItems: 0 } },
      { status: 500 }
    );
  }
}

// POST - Tambah buku fisik (versi sederhana)
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { judul, penulis, penerbit, tahun, isbn, lokasiRak, stok, deskripsi, schoolId } = body;
    
    logger.log("📝 POST Buku Fisik - judul:", judul, "schoolId:", schoolId);
    
    // Validasi required fields
    if (!judul || !penulis) {
      return NextResponse.json({ error: "Judul dan penulis wajib diisi" }, { status: 400 });
    }
    
    if (!schoolId) {
      return NextResponse.json({ error: "School ID diperlukan" }, { status: 400 });
    }
    
    // Generate barcode dengan timestamp (pasti unik)
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    const barcode = `BF${timestamp}${random}`;
    
    logger.log("✅ Generated barcode:", barcode);
    
    const stokNum = parseInt(stok) || 1;
    
    const bukuFisik = await db.bukuFisik.create({
      data: {
        judul: judul.trim(),
        penulis: penulis.trim(),
        penerbit: penerbit || null,
        tahun: tahun || null,
        isbn: isbn || null,
        lokasiRak: lokasiRak || null,
        stok: stokNum,
        stokTersedia: stokNum,
        barcode: barcode,
        deskripsi: deskripsi || null,
        schoolId: schoolId,
        kondisi: "BAIK",
      },
    });
    
    logger.log("✅ Buku Fisik created:", bukuFisik.id, "barcode:", barcode);
    
    return NextResponse.json(bukuFisik, { status: 201 });
    } catch (error) {
        if (error instanceof AuthError) {
          return NextResponse.json({ error: error.message }, { status: error.status });
        }
        logger.error("Error creating buku fisik:", error);
        return NextResponse.json({ error: "Gagal menambah buku: " + (error as Error).message }, { status: 500 });
      }
    }