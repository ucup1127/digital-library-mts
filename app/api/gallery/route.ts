// app/api/gallery/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createGallerySchema, formatZodError } from "@/lib/validations";
import { logAdminActivityServer } from "@/lib/admin-log-server";

// GET - Ambil galeri dengan pagination & search
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category"); // 🔥 Tangkap parameter kategori
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    
    if (!schoolId) {
      return NextResponse.json({ images: [], pagination: { totalItems: 0 }, categoryStats: {} });
    }
    
    const where: any = { schoolId };
    
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }
    if (category && category !== "all") {
      where.category = category; // 🔥 Filter berdasarkan kategori
    }
    
    // 1. Ambil data dengan paginasi
    const totalItems = await db.gallery.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;
    
    const images = await db.gallery.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // 🔥 2. Hitung statistik per kategori (Hanya untuk sekolah ini, abaikan filter search/category)
    const grouped = await db.gallery.groupBy({
      by: ['category'],
      where: { schoolId },
      _count: { _all: true }
    });

    const categoryStats: Record<string, number> = {};
    grouped.forEach((g) => {
      categoryStats[g.category] = g._count._all;
    });
    
    return NextResponse.json({
      images,
      pagination: { currentPage: page, pageSize: limit, totalPages, totalItems },
      categoryStats, // 🔥 Kirim data statistik ke frontend
    });
  } catch (error) {
    logger.error("Error fetching gallery:", error);
    return NextResponse.json({ images: [], pagination: { totalItems: 0 }, categoryStats: {} }, { status: 500 });
  }
}

// POST - Tambah galeri
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    const parseResult = createGallerySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { title, description, imageUrl, category, schoolId } = parseResult.data;

    const gallery = await db.gallery.create({
      data: {
        title,
        description: description || "",
        imageUrl,
        category: category || "kegiatan",
        schoolId,
      },
    });

    await logAdminActivityServer({
      action: "CREATE",
      targetType: "GALLERY",
      targetId: gallery.id,
      targetName: gallery.title,
    });

    return NextResponse.json(gallery, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error creating gallery:", error);
    return NextResponse.json({ error: "Gagal menambah galeri" }, { status: 500 });
  }
}