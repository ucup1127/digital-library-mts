// app/api/admin/users/import/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { requireAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { logAdminActivityServer } from "@/lib/admin-log-server";
import { revalidateTag } from "next/cache";
import crypto from "crypto";

// 🔥 Generate password random 8 char
function generatePassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pass = "";
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

// 🔥 Validasi row
interface ImportRow {
  nama: string;
  username: string;
  nisn: string;
  kelas: string;
  role: string;
  email: string;
}

function validateRow(row: ImportRow, index: number): string | null {
  if (!row.nama || !row.nama.trim()) {
    return `Baris ${index + 1}: Nama wajib diisi`;
  }

  if (!row.username || !row.username.trim()) {
    return `Baris ${index + 1}: Username wajib diisi`;
  }

  if (row.username.length < 4 || row.username.length > 20) {
    return `Baris ${index + 1}: Username harus 4-20 karakter`;
  }

  if (!/^[a-z0-9_]+$/.test(row.username)) {
    return `Baris ${index + 1}: Username hanya boleh huruf kecil, angka, underscore`;
  }

  const role = (row.role || "USER").toUpperCase();
  if (!["USER", "ADMIN"].includes(role)) {
    return `Baris ${index + 1}: Role harus USER atau ADMIN`;
  }

  if (role === "USER") {
    if (!row.nisn || !row.nisn.trim()) {
      return `Baris ${index + 1}: NISN wajib untuk role USER`;
    }
    if (!/^\d{10}$/.test(row.nisn.trim())) {
      return `Baris ${index + 1}: NISN harus 10 digit angka`;
    }
    if (!row.kelas || !row.kelas.trim()) {
      return `Baris ${index + 1}: Kelas wajib untuk role USER`;
    }
  }

  if (role === "ADMIN") {
    if (!row.email || !row.email.trim()) {
      return `Baris ${index + 1}: Email wajib untuk role ADMIN`;
    }
  }

  if (row.email && row.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email.trim())) {
      return `Baris ${index + 1}: Format email tidak valid`;
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const { rows, schoolId } = body;

    if (!schoolId) {
      return NextResponse.json({ error: "SchoolId wajib diisi" }, { status: 400 });
    }

    // 🔥 ADMIN cuma bisa import untuk sekolahnya sendiri
    if (session.role !== "SUPER_ADMIN" && session.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Tidak bisa import user untuk sekolah lain" },
        { status: 403 }
      );
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Data kosong" }, { status: 400 });
    }

    if (rows.length > 500) {
      return NextResponse.json(
        { error: "Maksimal 500 user per import" },
        { status: 400 }
      );
    }

    const results = {
      success: [] as any[],
      failed: [] as { row: number; error: string; data: ImportRow }[],
    };

    // 🔥 Cek duplikat di DB dulu (bulk)
    const existingUsernames = new Set<string>();
    const existingNisns = new Set<string>();
    const existingEmails = new Set<string>();

    const allUsers = await db.user.findMany({
      select: { username: true, nisn: true, email: true },
    });

    allUsers.forEach((u) => {
      if (u.username) existingUsernames.add(u.username.toLowerCase());
      if (u.nisn) existingNisns.add(u.nisn);
      if (u.email) existingEmails.add(u.email.toLowerCase());
    });

    // 🔥 Ambil max memberId untuk generate berikutnya
    const allMembers = await db.user.findMany({
      where: { memberId: { startsWith: "MTS" } },
      select: { memberId: true },
    });

    let maxMemberNumber = 0;
    allMembers.forEach((u) => {
      if (u.memberId) {
        const num = parseInt(u.memberId.replace(/\D/g, ""), 10);
        if (!isNaN(num) && num > maxMemberNumber) {
          maxMemberNumber = num;
        }
      }
    });

    // 🔥 Track username/nisn/email yang dipakai dalam batch ini (biar nggak duplikat internal)
    const batchUsernames = new Set<string>();
    const batchNisns = new Set<string>();
    const batchEmails = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const username = (row.username || "").trim().toLowerCase();
      const nisn = (row.nisn || "").trim();
      const email = (row.email || "").trim().toLowerCase();
      const role = (row.role || "USER").toUpperCase();

      // Validasi row
      const validationError = validateRow(
        {
          nama: row.nama,
          username,
          nisn,
          kelas: row.kelas,
          role,
          email,
        },
        i
      );

      if (validationError) {
        results.failed.push({
          row: i + 1,
          error: validationError,
          data: row,
        });
        continue;
      }

      // Cek duplikat
      if (existingUsernames.has(username) || batchUsernames.has(username)) {
        results.failed.push({
          row: i + 1,
          error: `Username "${username}" sudah dipakai`,
          data: row,
        });
        continue;
      }

      if (role === "USER" && (existingNisns.has(nisn) || batchNisns.has(nisn))) {
        results.failed.push({
          row: i + 1,
          error: `NISN "${nisn}" sudah dipakai`,
          data: row,
        });
        continue;
      }

      if (email && (existingEmails.has(email) || batchEmails.has(email))) {
        results.failed.push({
          row: i + 1,
          error: `Email "${email}" sudah dipakai`,
          data: row,
        });
        continue;
      }

      // Generate password
      const plainPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Generate memberId
      let memberId: string;
      if (role === "USER" && nisn) {
        memberId = nisn;
      } else {
        maxMemberNumber++;
        memberId = `MTS${String(maxMemberNumber).padStart(3, "0")}`;
      }

      try {
        const user = await db.user.create({
          data: {
            email: email || null,
            username,
            nisn: role === "USER" ? nisn : null,
            password: hashedPassword,
            name: row.nama.trim(),
            role,
            className: role === "USER" ? (row.kelas || "").trim() : "",
            schoolId,
            memberId,
            barcode: memberId,
            isActive: true,
          },
          select: {
            id: true,
            email: true,
            username: true,
            nisn: true,
            name: true,
            role: true,
            className: true,
            memberId: true,
          },
        });

        // Track dalam batch
        batchUsernames.add(username);
        if (nisn) batchNisns.add(nisn);
        if (email) batchEmails.add(email);

        results.success.push({
          ...user,
          password: plainPassword, // 🔥 Tampil password untuk admin
        });
      } catch (err: any) {
        results.failed.push({
          row: i + 1,
          error: err.message || "Gagal membuat user",
          data: row,
        });
      }
    }

    // 🔥 Log aktivitas
    await logAdminActivityServer({
      action: "IMPORT_USERS",
      targetType: "USER",
      targetId: schoolId,
      targetName: `Import ${results.success.length} user`,
      changes: {
        successCount: results.success.length,
        failedCount: results.failed.length,
      },
    });

    revalidateTag("admin-stats", "max");

    return NextResponse.json({
      success: true,
      message: `Berhasil import ${results.success.length} user, ${results.failed.length} gagal`,
      successCount: results.success.length,
      failedCount: results.failed.length,
      importedUsers: results.success,   // ← RENAME dari success
      failed: results.failed,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Import users error:", error);
    return NextResponse.json({ error: "Gagal import users" }, { status: 500 });
  }
}