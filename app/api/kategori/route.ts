// app/api/kategori/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createKategoriSchema, formatZodError } from "@/lib/validations";
import { logAdminActivityServer } from "@/lib/admin-log-server";
import { unstable_cache, revalidateTag } from "next/cache";

// ============================================
// Cache function
// ============================================
const getCachedCategories = unstable_cache(
  async () => {
    return db.category.findMany({
      orderBy: { name: "asc" },
    });
  },
  ["kategori-list"],
  { revalidate: 300, tags: ["kategori"] }
);

export async function GET() {
  try {
    const categories = await getCachedCategories();
    return NextResponse.json(categories);
  } catch (error) {
    logger.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Gagal memuat kategori" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    // 🔥 Validasi pakai Zod
    const parseResult = createKategoriSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { name } = parseResult.data;

    // Cek duplikat
    const existingCategory = await db.category.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    if (existingCategory) {
      return NextResponse.json({ error: "Kategori sudah ada!" }, { status: 400 });
    }

    const newCategory = await db.category.create({
      data: { name },
    });

    // 🔥 Log aktivitas
    await logAdminActivityServer({
      action: "CREATE",
      targetType: "KATEGORI",
      targetId: newCategory.id,
      targetName: newCategory.name,
    });

    // 🔥 Invalidate cache
    revalidateTag("kategori", "max");
    revalidateTag("admin-stats", "max");

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error creating category:", error);
    return NextResponse.json({ error: "Gagal menambah kategori" }, { status: 500 });
  }
}