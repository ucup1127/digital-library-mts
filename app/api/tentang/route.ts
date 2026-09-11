// app/api/tentang/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    
    console.log("📌 GET Public Tentang - schoolId:", schoolId);
    
    if (!schoolId) {
      return NextResponse.json({ error: "School ID diperlukan" }, { status: 400 });
    }
    
    // Cari data sekolah
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, logo: true }
    });
    
    if (!school) {
      return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 });
    }
    
    // 🔥 Ambil statistik dari database
    const totalBooks = await db.book.count({ where: { schoolId } });
    const totalUsers = await db.user.count({ 
      where: { 
        schoolId,
        role: "USER",
        isActive: true,
      } 
    });
    const totalBukuDigital = await db.book.count({ 
      where: { 
        schoolId,
        fileUrl: { not: null },
      } 
    });
    const totalCategories = await db.category.count();
    
    // Cari profil sekolah
    let profile = await db.schoolProfile.findUnique({
      where: { schoolId },
    });
    
    // Jika belum ada profil, return data default
    if (!profile) {
      return NextResponse.json({
        vision: `Visi ${school.name}`,
        mission: `Misi ${school.name}`,
        history: `Sejarah ${school.name}`,
        address: school.name,
        phone: "",
        email: "",
        website: "",
        school: {
          name: school.name,
          logo: school.logo,
        },
        stats: {
          totalBooks,
          totalUsers,
          totalBukuDigital,
          totalCategories,
        },
      });
    }
    
    return NextResponse.json({
      vision: profile.vision || "",
      mission: profile.mission || "",
      history: profile.history || "",
      address: profile.address || "",
      phone: profile.phone || "",
      email: profile.email || "",
      website: profile.website || "",
      school: {
        name: school.name,
        logo: school.logo,
      },
      stats: {
        totalBooks,
        totalUsers,
        totalBukuDigital,
        totalCategories,
      },
    });
  } catch (error) {
    console.error("Error fetching public tentang:", error);
    return NextResponse.json(
      { error: "Gagal memuat data", details: String(error) },
      { status: 500 }
    );
  }
}