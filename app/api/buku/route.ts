// app/api/buku/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createBookSchema, formatZodError } from "@/lib/validations";
import { logAdminActivityServer } from "@/lib/admin-log-server";
import { revalidateTag } from "next/cache";

// ============================================
// GET — Ambil daftar buku
// Tampilkan: buku sekolah sendiri + buku shared dari sekolah lain
// ============================================
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
      // 🔥 Sekolah sendiri + shared dari sekolah lain
      where.OR = [
        { schoolId },
        { isShared: true },
      ];
    } else {
      return NextResponse.json({
        books: [],
        pagination: { currentPage: page, totalPages: 0, totalItems: 0 },
      });
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { author: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    if (categoryId && categoryId !== "all") {
      where.categories = {
        some: { categoryId: categoryId },
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

    const [books, total] = await Promise.all([
      db.book.findMany({
        where,
        include: {
          categories: {
            include: { category: true },
          },
          school: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.book.count({ where }),
    ]);

    return NextResponse.json({
      books,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    logger.error("Error fetching books:", error);
    return NextResponse.json({ books: [], error: "Gagal memuat buku" }, { status: 500 });
  }
}

// ============================================
// POST — Tambah buku
// ============================================
export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json();

    const parseResult = createBookSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const {
      title,
      author,
      description,
      coverUrl,
      fileUrl,
      year,
      schoolId,
      categories,
      isShared,
    } = parseResult.data;

    // 🔥 ADMIN hanya bisa upload buku untuk sekolahnya sendiri
    if (session.role !== "SUPER_ADMIN" && session.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Tidak bisa upload buku untuk sekolah lain" },
        { status: 403 }
      );
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
        uploadedBy: session.userId,
        isShared: isShared ?? true,
      },
    });

    if (categories && categories.length > 0) {
      await db.bookCategory.createMany({
        data: categories.map((categoryId) => ({
          bookId: book.id,
          categoryId,
        })),
      });
    }

    await logAdminActivityServer({
      action: "CREATE",
      targetType: "BOOK",
      targetId: book.id,
      targetName: book.title,
      changes: { isShared: book.isShared },
    });

    revalidateTag("admin-stats", "max");

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error creating book:", error);
    return NextResponse.json({ error: "Gagal menambah buku" }, { status: 500 });
  }
}