// app/api/admin/auto-backup/route.ts
import { NextResponse } from "next/server";
import { requireBackupToken } from "@/lib/backup-auth";
import { getAllBackupData } from "@/lib/backup-data";
import { writeFile, mkdir, readdir, stat, unlink } from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  // Cek token
  const authError = requireBackupToken(request);
  if (authError) return authError;

  try {
    const database = await getAllBackupData();

    const backupData = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      database,
    };

    // Buat folder backup kalau belum ada
    const backupDir = path.join(process.cwd(), "backups");
    await mkdir(backupDir, { recursive: true });

    // Simpan file backup
    const date = new Date().toISOString().split("T")[0];
    const fileName = `backup-${date}.json`;
    const filePath = path.join(backupDir, fileName);
    const jsonString = JSON.stringify(backupData, null, 2);
    await writeFile(filePath, jsonString);

    // Hapus backup lama (lebih dari 7 hari)
    const files = await readdir(backupDir);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = await stat(filePath);
      if (stats.mtimeMs < sevenDaysAgo) {
        await unlink(filePath);
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
    return NextResponse.json(
      { error: "Gagal backup" },
      { status: 500 }
    );
  }
}