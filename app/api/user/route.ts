// app/api/admin/users/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    
    const where: any = {};
    
    // ✅ Filter by school (kecuali untuk SUPER ADMIN nanti)
    if (schoolId) {
      where.schoolId = schoolId;
    }
    
    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, password, name, role, className, schoolId } = await request.json();
    
    if (!email || !password || !schoolId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || "USER",
        className,
        schoolId, // ✅ wajib diisi
      },
    });
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Gagal menambah user" }, { status: 500 });
  }
}