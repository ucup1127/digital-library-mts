// app/api/admin/restore/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("backup") as File;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    const text = await file.text();
    const backupData = JSON.parse(text);

    // Validasi struktur backup
    if (!backupData.database) {
      return NextResponse.json({ error: "Format backup tidak valid" }, { status: 400 });
    }

    // Gunakan transaction untuk restore
    await db.$transaction(async (tx) => {
      // Hapus data lama (urutan penting karena foreign key)
      await tx.visitorLog.deleteMany();
      await tx.bookCategory.deleteMany();
      await tx.book.deleteMany();
      await tx.category.deleteMany();
      await tx.user.deleteMany();
      await tx.school.deleteMany();

      // Restore data baru
      if (backupData.database.schools?.length) {
        for (const school of backupData.database.schools) {
          await tx.school.create({ data: school });
        }
      }

      if (backupData.database.categories?.length) {
        for (const category of backupData.database.categories) {
          await tx.category.create({ data: category });
        }
      }

      if (backupData.database.users?.length) {
        for (const user of backupData.database.users) {
          await tx.user.create({ data: user });
        }
      }

      if (backupData.database.books?.length) {
        for (const book of backupData.database.books) {
          const { categories, ...bookData } = book;
          await tx.book.create({ data: bookData });
        }
      }

      if (backupData.database.bookCategories?.length) {
        for (const bc of backupData.database.bookCategories) {
          await tx.bookCategory.create({ data: bc });
        }
      }

      if (backupData.database.visitorLogs?.length) {
        for (const log of backupData.database.visitorLogs) {
          await tx.visitorLog.create({ data: log });
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Database berhasil direstore!" 
    });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: "Gagal restore database" }, { status: 500 });
  }
}