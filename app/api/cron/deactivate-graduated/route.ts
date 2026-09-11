// app/api/cron/deactivate-graduated/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("🔄 Running auto-deactivate graduated students...");
    
    const currentYear = new Date().getFullYear();
    
    // 🔥 Contoh: Nonaktifkan user dengan kelas 9 (lulus)
    const result = await db.user.updateMany({
      where: {
        role: "USER",
        isActive: true,
        className: {
          startsWith: "9", // Kelas 9A, 9B, 9C, dll
        },
      },
      data: {
        isActive: false,
        graduatedAt: new Date(),
      },
    });
    
    console.log(`✅ ${result.count} user dinonaktifkan (kelas 9)`);
    
    return NextResponse.json({
      success: true,
      deactivated: result.count,
      message: `Berhasil menonaktifkan ${result.count} siswa lulus`,
    });
  } catch (error) {
    console.error("Error deactivating graduated students:", error);
    return NextResponse.json({ error: "Gagal" }, { status: 500 });
  }
}