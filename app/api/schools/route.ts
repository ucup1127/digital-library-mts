// app/api/schools/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET - Ambil semua sekolah
export async function GET() {
  try {
    const schools = await db.school.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true, // ✅ Sertakan logo
        _count: {
          select: {
            users: true,
            books: true,
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    // Format response
    const formattedSchools = schools.map(school => ({
      id: school.id,
      name: school.name,
      slug: school.slug,
      logo: school.logo,
      totalUsers: school._count.users,
      totalBooks: school._count.books,
    }));
    
    return NextResponse.json(formattedSchools);
  } catch (error) {
    console.error("Error fetching schools:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST - Tambah sekolah baru
export async function POST(request: Request) {
  try {
    const { name, slug, logo } = await request.json();
    
    if (!name || !slug) {
      return NextResponse.json({ error: "Nama dan slug harus diisi" }, { status: 400 });
    }
    
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
    
    return NextResponse.json(school, { status: 201 });
  } catch (error) {
    console.error("Error creating school:", error);
    return NextResponse.json({ error: "Gagal menambahkan sekolah" }, { status: 500 });
  }
}