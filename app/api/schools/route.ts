// app/api/schools/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, requireSuperAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createSchoolSchema, formatZodError } from "@/lib/validations";
import { logAdminActivityServer } from "@/lib/admin-log-server";
import { unstable_cache, revalidateTag } from "next/cache";

// ============================================
// Cache function
// ============================================
const getCachedSchools = unstable_cache(
  async () => {
    const schools = await db.school.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        _count: {
          select: {
            users: true,
            books: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return schools.map((school) => ({
      id: school.id,
      name: school.name,
      slug: school.slug,
      logo: school.logo,
      totalUsers: school._count.users,
      totalBooks: school._count.books,
    }));
  },
  ["schools-list"],
  { revalidate: 300, tags: ["schools"] }
);

export async function GET() {
  try {
    await requireAdmin();
    const formattedSchools = await getCachedSchools();
    return NextResponse.json(formattedSchools);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error fetching schools:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json();

    // 🔥 Validasi pakai Zod
    const parseResult = createSchoolSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { name, slug, logo } = parseResult.data;

    const existingSchool = await db.school.findUnique({
      where: { slug },
    });

    if (existingSchool) {
      return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });
    }

    const school = await db.school.create({
      data: {
        name,
        slug,
        logo: logo || null,
      },
    });

    // 🔥 Log aktivitas
    await logAdminActivityServer({
      action: "CREATE",
      targetType: "SCHOOL",
      targetId: school.id,
      targetName: school.name,
    });

    // 🔥 Invalidate cache (Next.js 16: wajib 2 argumen)
    revalidateTag("schools", "max");
    revalidateTag("schools-public", "max");
    revalidateTag("admin-stats", "max");

    return NextResponse.json(school, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error creating school:", error);
    return NextResponse.json({ error: "Gagal menambahkan sekolah" }, { status: 500 });
  }
}