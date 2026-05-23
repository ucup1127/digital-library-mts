// app/api/admin/backup/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Ambil semua data dari database
    const [schools, categories, users, books, bookCategories, visitorLogs] = await Promise.all([
      db.school.findMany(),
      db.category.findMany(),
      db.user.findMany({
        omit: { password: true }, // Jangan backup password untuk keamanan
      }),
      db.book.findMany({
        include: {
          categories: true,
        },
      }),
      db.bookCategory.findMany(),
      db.visitorLog.findMany(),
    ]);

    // Format data backup
    const backupData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      database: {
        schools,
        categories,
        users,
        books,
        bookCategories,
        visitorLogs,
      },
    };

    // Konversi ke JSON
    const jsonString = JSON.stringify(backupData, null, 2);

    // Return sebagai file download
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="backup-muhpathlib-${new Date().toISOString().split('T')[0]}.json"`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json(
      { error: "Gagal melakukan backup database" },
      { status: 500 }
    );
  }
}