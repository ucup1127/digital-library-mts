// app/api/school-profile/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";

// GET - Ambil profil sekolah
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    
    console.log("SchoolProfile GET - schoolId:", schoolId);
    
    if (!schoolId) {
      return NextResponse.json({ error: "SchoolId diperlukan" }, { status: 400 });
    }
    
    // Cek apakah sekolah ada
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, slug: true, logo: true }
    });
    
    if (!school) {
      console.log("School not found:", schoolId);
      return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 });
    }
    
    console.log("School found:", school.name);
    
    // Cari profil sekolah
    let profile = await db.schoolProfile.findUnique({
      where: { schoolId },
    });
    
    console.log("Profile found:", profile ? "Yes" : "No");
    
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
        console.log("Created default profile for school:", schoolId);
      } catch (createError) {
        console.error("Error creating default profile:", createError);
        return NextResponse.json({ 
          error: "Gagal membuat profil default",
          details: createError instanceof Error ? createError.message : String(createError)
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      ...profile,
      school: school
    });
  } catch (error) {
    console.error("Error fetching school profile:", error);
    return NextResponse.json({ 
      error: "Gagal mengambil profil sekolah",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// POST - Update atau buat profil sekolah
export async function POST(request: Request) {
  try {
    const session = await requireAdmin();  // ← tambah ini
    const body = await request.json();
    console.log("SchoolProfile POST - body:", body);
    
    const { schoolId, vision, mission, history, address, phone, email, website } = body;
    
    if (!schoolId) {
      return NextResponse.json({ error: "SchoolId diperlukan" }, { status: 400 });
    }
    
    // 🔥 Cek schoolId — ADMIN cuma bisa update sekolahnya sendiri
    if (session.role !== "SUPER_ADMIN" && session.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Tidak bisa update profil sekolah lain" },
        { status: 403 }
      );
    }
    
    // Cek apakah sekolah ada
    const school = await db.school.findUnique({
      where: { id: schoolId }
    });
    
    if (!school) {
      console.log("School not found for update:", schoolId);
      return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 });
    }
    
    console.log("Updating profile for school:", school.name);
    
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
    
    console.log("Profile updated successfully");
    
    return NextResponse.json(profile);
    } catch (error) {
        if (error instanceof AuthError) {
          return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("Error updating school profile:", error);
        return NextResponse.json({ 
          error: "Gagal update profil sekolah",
          details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
      }
    }