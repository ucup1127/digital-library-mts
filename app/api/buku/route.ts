// app/api/buku/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";
import { logError, logWarning, logInfo } from "@/lib/system-log";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("category");
    const year = searchParams.get("year");
    const sortBy = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    
    // BUAT CACHE KEY berdasarkan semua parameter
    const cacheKey = `books:${schoolId || 'all'}:${search}:${categoryId || 'all'}:${year || 'all'}:${sortBy}:${page}:${limit}`;
    
    // CEK CACHE DULU
    const cachedData = await cacheGet(cacheKey);
    if (cachedData) {
      console.log("✅ Cache HIT untuk:", cacheKey);
      return NextResponse.json(cachedData);
    }
    
    console.log("📡 Cache MISS, ambil dari database:", cacheKey);
    
    // BUILD WHERE CLAUSE
    const where: any = {};
    
    if (schoolId) {
      where.schoolId = schoolId;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (categoryId && categoryId !== "all") {
      where.categories = {
        some: { categoryId: categoryId }
      };
    }
    
    if (year) {
      where.year = year;
    }
    
    // SORTING
    let orderBy: any = {};
    switch (sortBy) {
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "most_viewed":
        orderBy = { views: "desc" };
        break;
      case "least_viewed":
        orderBy = { views: "asc" };
        break;
      case "title_asc":
        orderBy = { title: "asc" };
        break;
      case "title_desc":
        orderBy = { title: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }
    
    const books = await db.book.findMany({
      where,
      include: {
        categories: {
          include: { category: true }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });
    
    const total = await db.book.count({ where });
    
    const responseData = {
      books,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    };
    
    // SIMPAN KE CACHE (5 menit = 300 detik)
    await cacheSet(cacheKey, responseData, 300);
    
    // Catat aktivitas GET (INFO log)
    await logInfo(`GET buku - page:${page}, search:${search || "none"}`, {
      path: "/api/buku",
      method: "GET",
    });
    
    return NextResponse.json(responseData);
  } catch (error) {
    // 🔥 Catat error ke system log
    await logError(error as Error, {
      path: "/api/buku",
      method: "GET",
    });
    
    console.error("Error fetching books:", error);
    return NextResponse.json({ 
      books: [], 
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0 }
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, author, description, coverUrl, fileUrl, year, schoolId, categories } = body;
    
    if (!title || !author || !schoolId) {
      await logWarning("Data tidak lengkap saat tambah buku", {
        path: "/api/buku",
        method: "POST",
      });
      return NextResponse.json({ error: "Data tidak lengkap: title, author, schoolId wajib diisi" }, { status: 400 });
    }
    
    const book = await db.book.create({
      data: {
        title,
        author,
        description: description || null,
        coverUrl: coverUrl || null,
        fileUrl: fileUrl || null,
        year: year || null,
        schoolId,
      },
    });
    
    if (categories && categories.length > 0) {
      for (const categoryId of categories) {
        await db.bookCategory.create({
          data: {
            bookId: book.id,
            categoryId,
          },
        });
      }
    }
    
    // HAPUS CACHE YANG TERKAIT DENGAN BUKU
    await cacheDel(`books:*`);
    
    // Catat aktivitas POST (INFO log)
    await logInfo(`Buku baru ditambahkan: ${title} oleh ${author}`, {
      path: "/api/buku",
      method: "POST",
    });
    
    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    // 🔥 Catat error ke system log
    await logError(error as Error, {
      path: "/api/buku",
      method: "POST",
    });
    
    console.error("Error creating book:", error);
    return NextResponse.json({ error: "Gagal menambah buku" }, { status: 500 });
  }
}