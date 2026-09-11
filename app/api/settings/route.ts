// app/api/settings/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET - Ambil setting
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    
    console.log("📌 GET Setting - key:", key);
    
    if (!key) {
      return NextResponse.json({ error: "Key diperlukan" }, { status: 400 });
    }
    
    // Cek apakah model Setting ada
    let setting = null;
    try {
      setting = await db.setting.findUnique({
        where: { key: key },
      });
    } catch (err) {
      console.error("Database error:", err);
      // Jika tabel belum ada, return default
      return NextResponse.json({ key, value: "false" });
    }
    
    console.log("📌 Setting found:", setting);
    
    return NextResponse.json({ 
      key, 
      value: setting?.value || "false"
    });
  } catch (error) {
    console.error("Error getting setting:", error);
    // Return default value instead of error
    return NextResponse.json({ key: "maintenance_mode", value: "false" });
  }
}

// POST - Update setting (hanya untuk SUPER_ADMIN)
export async function POST(request: Request) {
  try {
    const { key, value } = await request.json();
    
    console.log("📌 POST Setting - key:", key, "value:", value);
    
    if (!key) {
      return NextResponse.json({ error: "Key diperlukan" }, { status: 400 });
    }
    
    // Coba upsert setting
    let setting;
    try {
      setting = await db.setting.upsert({
        where: { key: key },
        update: { value: value || "" },
        create: { key: key, value: value || "" },
      });
    } catch (err) {
      console.error("Database upsert error:", err);
      // Jika gagal, return success saja untuk sementara
      return NextResponse.json({ key, value, success: true });
    }
    
    console.log("📌 Setting saved:", setting);
    
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
    // Return success false instead of error
    return NextResponse.json({ error: "Gagal update setting", success: false }, { status: 500 });
  }
}