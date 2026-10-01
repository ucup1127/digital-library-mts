// app/api/buku-fisik/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createBukuFisikSchema, formatZodError } from "@/lib/validations";
import { logAdminActivityServer } from "@/lib/admin-log-server";
import { revalidateTag } from "next/cache";

// GET - Ambil daftar buku fisik
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = {};

    if (schoolId && schoolId !== "") {
      where.schoolId = schoolId;
    } else {
      return NextResponse.json({
        books: [],
        pagination: { currentPage: page, pageSize: limit, totalPages: 1, totalItems: 0 },
      });
    }

    if (search) {
      where.OR = [
        { judul: { contains: search, mode: "insensitive" } },
        { penulis: { contains: search, mode: "insensitive" } },
        { isbn: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }

    const totalItems = await db.bukuFisik.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    const bukuFisik = await db.bukuFisik.findMany({
      where,
      orderBy: { judul: "asc" },
      skip,
      take: limit,
    });

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

// POST - Tambah buku fisik
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    const parseResult = createBukuFisikSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { judul, penulis, penerbit, tahun, isbn, lokasiRak, stok, deskripsi, schoolId } =
      parseResult.data;

    // Generate barcode
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    const barcode = `BF${timestamp}${random}`;

    const bukuFisik = await db.bukuFisik.create({
      data: {
        judul,
        penulis,
        penerbit: penerbit || null,
        tahun: tahun || null,
        isbn: isbn || null,
        lokasiRak: lokasiRak || null,
        stok,
        stokTersedia: stok,
        barcode,
        deskripsi: deskripsi || null,
        schoolId,
        kondisi: "BAIK",
      },
    });

    // 🔥 Log aktivitas
    await logAdminActivityServer({
      action: "CREATE",
      targetType: "BUKU_FISIK",
      targetId: bukuFisik.id,
      targetName: bukuFisik.judul,
    });

    // 🔥 Invalidate cache
    revalidateTag("admin-stats", "max");

    return NextResponse.json(bukuFisik, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error creating buku fisik:", error);
    return NextResponse.json({ error: "Gagal menambah buku" }, { status: 500 });
  }
}