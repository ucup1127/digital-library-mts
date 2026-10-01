// app/api/admin/tentang/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { updateTentangSchema, formatZodError } from "@/lib/validations";
import { logAdminActivityServer } from "@/lib/admin-log-server";
import { unstable_cache, revalidateTag } from "next/cache";

// ============================================
// Cache function — per schoolId
// (Next.js otomatis include argumen ke cache key)
// ============================================
const getCachedTentang = unstable_cache(
  async (schoolId: string) => {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, logo: true },
    });

    if (!school) return null;

    let profile = await db.schoolProfile.findUnique({
      where: { schoolId },
    });

    // Kalau belum ada profil, return default (jangan create di GET)
    if (!profile) {
      return {
        vision: `Visi ${school.name}`,
        mission: `Misi ${school.name}`,
        history: `Sejarah ${school.name}`,
        address: school.name,
        phone: "",
        email: "",
        website: "",
        school,
      };
    }

    return {
      ...profile,
      school,
    };
  },
  ["admin-tentang"],
  { revalidate: 300, tags: ["school-profile"] }
);

// ============================================
// GET - Ambil data tentang untuk admin edit
// ============================================
export async function GET(request: Request) {
  try {
    const session = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");

    if (!schoolId) {
      return NextResponse.json({ error: "School ID diperlukan" }, { status: 400 });
    }

    // 🔥 Cek: admin cuma bisa akses sekolahnya sendiri
    if (session.role !== "SUPER_ADMIN" && session.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Tidak bisa akses profil sekolah lain" },
        { status: 403 }
      );
    }

    const data = await getCachedTentang(schoolId);

    if (!data) {
      return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error("Error fetching school profile:", error);
    return NextResponse.json(
      { error: "Gagal mengambil profil sekolah" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Update profil sekolah
// ============================================
export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json();

    // 🔥 Validasi pakai Zod
    const parseResult = updateTentangSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      );
    }

    const { schoolId, vision, mission, history, address, phone, email, website } =
      parseResult.data;

    // Cek akses sekolah
    if (session.role !== "SUPER_ADMIN" && session.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Tidak bisa update profil sekolah lain" },
        { status: 403 }
      );
    }

    const school = await db.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 });
    }

    const profile = await db.schoolProfile.upsert({
      where: { schoolId },
      update: {
        vision: vision || `Visi ${school.name}`,
        mission: mission || `Misi ${school.name}`,
        history: history || `Sejarah ${school.name}`,
        address: address || school.name,
        phone: phone || "",
        email: email || "",
        website: website || "",
      },
      create: {
        schoolId,
        vision: vision || `Visi ${school.name}`,
        mission: mission || `Misi ${school.name}`,
        history: history || `Sejarah ${school.name}`,
        address: address || school.name,
        phone: phone || "",
        email: email || "",
        website: website || "",
      },
    });

    // 🔥 Log aktivitas
    await logAdminActivityServer({
      action: "UPDATE_TENTANG",
      targetType: "SCHOOL_PROFILE",
      targetId: profile.id,
      targetName: school.name,
    });

    // 🔥 Invalidate cache
    revalidateTag("school-profile", "max");

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Error updating school profile:", error);
    return NextResponse.json({ error: "Gagal update profil sekolah" }, { status: 500 });
  }
}