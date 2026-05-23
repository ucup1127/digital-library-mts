// app/api/settings/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET - Ambil setting
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    
    if (!key) {
      return NextResponse.json({ error: "Key diperlukan" }, { status: 400 });
    }
    
    const setting = await db.setting.findUnique({
      where: { key },
    });
    
    return NextResponse.json({ 
      key, 
      value: setting?.value || null 
    });
  } catch (error) {
    console.error("Error getting setting:", error);
    return NextResponse.json({ error: "Gagal mengambil setting" }, { status: 500 });
  }
}

// POST - Update setting (hanya untuk SUPER_ADMIN)
export async function POST(request: Request) {
  try {
    const { key, value } = await request.json();
    
    if (!key) {
      return NextResponse.json({ error: "Key diperlukan" }, { status: 400 });
    }
    
    const setting = await db.setting.upsert({
      where: { key },
      update: { value: value || "" },
      create: { key, value: value || "" },
    });
    
    // Buat response dengan cookie
    const response = NextResponse.json(setting);
    
    // Set cookie untuk maintenance mode (agar middleware bisa baca)
    if (key === 'maintenance_mode') {
      response.cookies.set('maintenance_mode', value, {
        path: '/',
        maxAge: 60 * 60 * 24, // 1 hari
        sameSite: 'lax',
      });
    }
    
    return response;
  } catch (error) {
    console.error("Error updating setting:", error);
    return NextResponse.json({ error: "Gagal update setting" }, { status: 500 });
  }
}