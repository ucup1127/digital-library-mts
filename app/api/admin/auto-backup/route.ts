// app/api/admin/auto-backup/route.ts
import { NextResponse } from "next/server";
import { getAllBackupData } from "@/lib/backup-data";
import { writeFile, mkdir, readdir, stat, unlink } from "fs/promises";
import path from "path";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  // 🔥 Cek token untuk cron job
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const expectedToken = process.env.BACKUP_SECRET_TOKEN;

  if (!expectedToken) {
    logger.error("BACKUP_SECRET_TOKEN tidak di-set");
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  if (token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const database = await getAllBackupData();

    const backupData = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      database,
    };

    const backupDir = path.join(process.cwd(), "backups");
    await mkdir(backupDir, { recursive: true });

    const date = new Date().toISOString().split("T")[0];
    const fileName = `backup-${date}.json`;
    const filePath = path.join(backupDir, fileName);
    const jsonString = JSON.stringify(backupData, null, 2);
    await writeFile(filePath, jsonString);

    // Hapus backup lama (> 7 hari)
    const files = await readdir(backupDir);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = await stat(filePath);
      if (stats.mtimeMs < sevenDaysAgo) {
        await unlink(filePath);
        logger.log(`Deleted old backup: ${file}`);
      }
    }

    logger.log(`Auto backup created: ${fileName}`);

    return NextResponse.json({
      success: true,
      message: `Backup berhasil: ${fileName}`,
      path: `/backups/${fileName}`,
      size: `${(jsonString.length / 1024).toFixed(2)} KB`,
    });
  } catch (error) {
    logger.error("Auto backup error:", error);
    return NextResponse.json(
      { error: "Gagal backup" },
      { status: 500 }
    );
  }
}