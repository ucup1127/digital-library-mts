// app/api/kategori/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET: Ambil semua kategori
export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Gagal memuat kategori" }, { status: 500 });
  }
}

// POST: Tambah kategori baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;
    
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Nama kategori tidak boleh kosong" }, { status: 400 });
    }
    
    // Cek apakah kategori sudah ada
    const existingCategory = await db.category.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });
    
    if (existingCategory) {
      return NextResponse.json({ error: "Kategori sudah ada!" }, { status: 400 });
    }
    
    const newCategory = await db.category.create({
      data: { name: name.trim() }
    });
    
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Gagal menambah kategori" }, { status: 500 });
  }
}