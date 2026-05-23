// app/api/admin/auto-backup/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const backupToken = process.env.BACKUP_SECRET_TOKEN;
    
    // Validasi token untuk keamanan (hanya bisa diakses oleh cron job)
    if (backupToken && token !== backupToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Ambil semua data
    const [schools, categories, users, books, bookCategories, visitorLogs] = await Promise.all([
      db.school.findMany(),
      db.category.findMany(),
      db.user.findMany({
        omit: { password: true }, // Password tidak ikut backup
      }),
      db.book.findMany({
        include: { categories: true },
      }),
      db.bookCategory.findMany(),
      db.visitorLog.findMany({
        take: 1000, // Batasi 1000 log terakhir
      }),
    ]);
    
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
    
    // Buat folder backup jika belum ada
    const backupDir = path.join(process.cwd(), "backups");
    await mkdir(backupDir, { recursive: true });
    
    // Simpan file backup
    const date = new Date().toISOString().split("T")[0];
    const fileName = `backup-${date}.json`;
    const filePath = path.join(backupDir, fileName);
    const jsonString = JSON.stringify(backupData, null, 2);
    await writeFile(filePath, jsonString);
    
    // Hapus backup lama (lebih dari 7 hari)
    const fs = require("fs");
    const files = fs.readdirSync(backupDir);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs < sevenDaysAgo) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old backup: ${file}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Backup berhasil: ${fileName}`,
      path: `/backups/${fileName}`,
      size: `${(jsonString.length / 1024).toFixed(2)} KB`,
    });
  } catch (error) {
    console.error("Auto backup error:", error);
    return NextResponse.json({ error: "Gagal backup" }, { status: 500 });
  }
}