// app/api/gallery/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET - Ambil galeri dengan pagination & search
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    
    console.log("📸 GET Gallery - schoolId:", schoolId, "page:", page, "limit:", limit);
    
    if (!schoolId) {
      return NextResponse.json({ images: [], pagination: { totalItems: 0 } });
    }
    
    const where: any = { schoolId };
    
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }
    
    const totalItems = await db.gallery.count({ where });
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;
    
    const images = await db.gallery.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });
    
    return NextResponse.json({
      images,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalPages,
        totalItems,
      },
    });
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return NextResponse.json({ images: [], pagination: { totalItems: 0 } }, { status: 500 });
  }
}

// POST - Tambah galeri
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, imageUrl, category, schoolId } = body;
    
    if (!title || !imageUrl) {
      return NextResponse.json({ error: "Judul dan URL gambar wajib diisi" }, { status: 400 });
    }
    
    if (!schoolId) {
      return NextResponse.json({ error: "schoolId diperlukan" }, { status: 400 });
    }
    
    const gallery = await db.gallery.create({
      data: {
        title,
        description: description || "",
        imageUrl,
        category: category || "kegiatan",
        schoolId,
      },
    });
    
    return NextResponse.json(gallery, { status: 201 });
  } catch (error) {
    console.error("Error creating gallery:", error);
    return NextResponse.json({ error: "Gagal menambah galeri" }, { status: 500 });
  }
}