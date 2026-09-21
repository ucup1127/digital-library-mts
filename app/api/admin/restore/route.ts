// app/api/admin/restore/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin, AuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    // 🔥 WAJIB: admin only (session)
    await requireSuperAdmin();
    const formData = await request.formData();
    const file = formData.get("backup") as File;

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const backupData = JSON.parse(text);

    if (!backupData.database) {
      return NextResponse.json(
        { error: "Format backup tidak valid" },
        { status: 400 }
      );
    }

    const d = backupData.database;

    // Gunakan transaction untuk restore
    await db.$transaction(async (tx) => {
      // 1. HAPUS data lama (urutan terbalik dari restore)
      await tx.peminjamanFisik.deleteMany();
      await tx.bukuFisikKategori.deleteMany();
      await tx.bukuFisik.deleteMany();
      await tx.bookCategory.deleteMany();
      await tx.book.deleteMany();
      await tx.gallery.deleteMany();
      await tx.schoolProfile.deleteMany();
      await tx.organization.deleteMany();
      await tx.setting.deleteMany();
      await tx.adminLog.deleteMany();
      await tx.systemLog.deleteMany();
      await tx.visitorLog.deleteMany();
      await tx.visitor.deleteMany();
      await tx.activeSession.deleteMany();
      await tx.user.deleteMany();
      await tx.category.deleteMany();
      await tx.school.deleteMany();

      // 2. RESTORE data baru (urutan sesuai RESTORE_ORDER)

      if (d.schools?.length) {
        for (const item of d.schools) {
          await tx.school.create({ data: item });
        }
      }

      if (d.categories?.length) {
        for (const item of d.categories) {
          await tx.category.create({ data: item });
        }
      }

      if (d.users?.length) {
        for (const item of d.users) {
          await tx.user.create({
            data: {
              ...item,
              password: "$2b$10$dummy", // password dummy — user harus reset
            },
          });
        }
      }

      if (d.books?.length) {
        for (const item of d.books) {
          const { categories, ...bookData } = item;
          await tx.book.create({ data: bookData });
        }
      }

      if (d.bookCategories?.length) {
        for (const item of d.bookCategories) {
          await tx.bookCategory.create({ data: item });
        }
      }

      if (d.bukuFisik?.length) {
        for (const item of d.bukuFisik) {
          await tx.bukuFisik.create({ data: item });
        }
      }

      if (d.bukuFisikKategori?.length) {
        for (const item of d.bukuFisikKategori) {
          await tx.bukuFisikKategori.create({ data: item });
        }
      }

      if (d.peminjamanFisik?.length) {
        for (const item of d.peminjamanFisik) {
          await tx.peminjamanFisik.create({ data: item });
        }
      }

      if (d.schoolProfiles?.length) {
        for (const item of d.schoolProfiles) {
          await tx.schoolProfile.create({ data: item });
        }
      }

      if (d.organizations?.length) {
        for (const item of d.organizations) {
          await tx.organization.create({ data: item });
        }
      }

      if (d.settings?.length) {
        for (const item of d.settings) {
          await tx.setting.create({ data: item });
        }
      }

      if (d.galleries?.length) {
        for (const item of d.galleries) {
          await tx.gallery.create({ data: item });
        }
      }

      if (d.adminLogs?.length) {
        for (const item of d.adminLogs) {
          await tx.adminLog.create({ data: item });
        }
      }

      if (d.systemLogs?.length) {
        for (const item of d.systemLogs) {
          await tx.systemLog.create({ data: item });
        }
      }

      if (d.visitorLogs?.length) {
        for (const item of d.visitorLogs) {
          await tx.visitorLog.create({ data: item });
        }
      }

      if (d.visitors?.length) {
        for (const item of d.visitors) {
          await tx.visitor.create({ data: item });
        }
      }

      if (d.activeSessions?.length) {
        for (const item of d.activeSessions) {
          await tx.activeSession.create({ data: item });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Database berhasil direstore!",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Restore error:", error);
    return NextResponse.json(
      { error: "Gagal restore database" },
      { status: 500 }
    );
  }
}