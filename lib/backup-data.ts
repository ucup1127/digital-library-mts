// lib/backup-data.ts
import { db } from "@/lib/db";

/**
 * Ambil SEMUA data untuk backup.
 * Urutan penting: model tanpa foreign key dulu.
 */
export async function getAllBackupData() {
  const [
    schools,
    categories,
    users,
    books,
    bookCategories,
    bukuFisik,
    bukuFisikKategori,
    peminjamanFisik,
    schoolProfiles,
    organizations,
    settings,
    galleries,
    adminLogs,
    systemLogs,
    visitorLogs,
    visitors,
    activeSessions,
  ] = await Promise.all([
    db.school.findMany(),
    db.category.findMany(),
    db.user.findMany({ omit: { password: true } }),
    db.book.findMany(),
    db.bookCategory.findMany(),
    db.bukuFisik.findMany(),
    db.bukuFisikKategori.findMany(),
    db.peminjamanFisik.findMany(),
    db.schoolProfile.findMany(),
    db.organization.findMany(),
    db.setting.findMany(),
    db.gallery.findMany(),
    db.adminLog.findMany({ take: 5000 }),     // batasi biar nggak kebesaran
    db.systemLog.findMany({ take: 5000 }),    // batasi biar nggak kebesaran
    db.visitorLog.findMany({ take: 5000 }),   // naikkan dari 1000
    db.visitor.findMany({ take: 5000 }),
    db.activeSession.findMany(),
  ]);

  return {
    schools,
    categories,
    users,
    books,
    bookCategories,
    bukuFisik,
    bukuFisikKategori,
    peminjamanFisik,
    schoolProfiles,
    organizations,
    settings,
    galleries,
    adminLogs,
    systemLogs,
    visitorLogs,
    visitors,
    activeSessions,
  };
}

/**
 * Urutan restore — model tanpa foreign key dulu.
 * Ini penting biar foreign key constraint nggak error.
 */
export const RESTORE_ORDER = [
  "schools",
  "categories",
  "users",
  "books",
  "bookCategories",
  "bukuFisik",
  "bukuFisikKategori",
  "peminjamanFisik",
  "schoolProfiles",
  "organizations",
  "settings",
  "galleries",
  "adminLogs",
  "systemLogs",
  "visitorLogs",
  "visitors",
  "activeSessions",
] as const;