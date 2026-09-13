// app/api/buku/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("category");
    const year = searchParams.get("year");
    const sortBy = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    
    const where: any = {};
    
    if (schoolId) {
      where.schoolId = schoolId;
    } else {
      // Kalau nggak ada schoolId, return kosong
      return NextResponse.json({
        books: [],
        pagination: { currentPage: page, totalPages: 0, totalItems: 0 },
      });
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
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
    
    return NextResponse.json({
      books,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json({ books: [], error: "Gagal memuat buku" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();  
    const body = await request.json();
    const { title, author, description, coverUrl, fileUrl, year, schoolId, categories } = body;
    
    if (!title || !author || !schoolId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
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
    
    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error creating book:", error);
    return NextResponse.json({ error: "Gagal menambah buku" }, { status: 500 });
  }
}