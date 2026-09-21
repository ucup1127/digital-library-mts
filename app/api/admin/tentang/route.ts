// app/api/admin/tentang/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

// GET - Ambil data tentang untuk admin edit
export async function GET(request: Request) {
  try {
    const session = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");

    logger.log("📌 GET Admin Tentang - schoolId:", schoolId);

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

    // Cek apakah sekolah ada
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, logo: true },
    });

    if (!school) {
      logger.log("School not found:", schoolId);
      return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 });
    }

    // Cari profil sekolah
    let profile = await db.schoolProfile.findUnique({
      where: { schoolId },
    });

    logger.log("Profile found:", profile ? "Yes" : "No");

    // Jika belum ada profil, buat default
    if (!profile) {
      try {
        profile = await db.schoolProfile.create({
          data: {
            schoolId: schoolId,
            vision: `Visi ${school.name}`,
            mission: `Misi ${school.name}`,
            history: `Sejarah ${school.name}`,
            address: school.name,
            phone: "",
            email: "",
            website: "",
          },
        });
        logger.log("Created default profile for school:", schoolId);
      } catch (createError) {
        logger.error("Error creating default profile:", createError);
        return NextResponse.json({
          vision: `Visi ${school.name}`,
          mission: `Misi ${school.name}`,
          history: `Sejarah ${school.name}`,
          address: school.name,
          phone: "",
          email: "",
          website: "",
          school: school,
        });
      }
    }

    return NextResponse.json({
      ...profile,
      school: school,
    });
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

// POST - Update atau buat profil sekolah
export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    logger.log("📌 POST Admin Tentang - schoolId:", body.schoolId);

    const { schoolId, vision, mission, history, address, phone, email, website } = body;

    if (!schoolId) {
      return NextResponse.json({ error: "SchoolId diperlukan" }, { status: 400 });
    }

    // 🔥 Cek: admin cuma bisa update sekolahnya sendiri
    if (session.role !== "SUPER_ADMIN" && session.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Tidak bisa update profil sekolah lain" },
        { status: 403 }
      );
    }

    // Cek apakah sekolah ada
    const school = await db.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      logger.log("School not found for update:", schoolId);
      return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 });
    }

    logger.log("Updating profile for school:", school.name);

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

    logger.log("Profile updated successfully");

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error("Error updating school profile:", error);
    return NextResponse.json(
      { error: "Gagal update profil sekolah" },
      { status: 500 }
    );
  }
}