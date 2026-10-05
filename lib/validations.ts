// lib/validations.ts
import { z } from "zod";

// ============================================
// 🔐 AUTH
// ============================================

export const loginSchema = z.object({
  login: z
    .string({ message: "Username/Email wajib diisi" })
    .min(1, "Username/Email wajib diisi")
    .max(255, "Username/Email terlalu panjang")
    .trim()
    .toLowerCase(),
  password: z
    .string({ message: "Password wajib diisi" })
    .min(1, "Password wajib diisi")
    .max(100, "Password terlalu panjang"),
  type: z.enum(["user", "admin"], {
    message: "Tipe login tidak valid",
  }),
  rememberMe: z.boolean().optional(),
});

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const registerSchema = z
  .object({
    nisn: z
      .string({ message: "NISN wajib diisi" })
      .length(10, "NISN harus 10 digit")
      .regex(/^\d{10}$/, "NISN harus 10 digit angka")
      .trim(),
    name: z
      .string({ message: "Nama wajib diisi" })
      .min(2, "Nama minimal 2 karakter")
      .max(100, "Nama maksimal 100 karakter")
      .trim(),
    className: z
      .string({ message: "Kelas wajib diisi" })
      .min(1, "Kelas wajib diisi")
      .max(50, "Kelas maksimal 50 karakter")
      .trim(),
    username: z
      .string({ message: "Username wajib diisi" })
      .min(4, "Username minimal 4 karakter")
      .max(20, "Username maksimal 20 karakter")
      .regex(/^[a-z0-9_]+$/, "Username hanya boleh huruf kecil, angka, dan underscore")
      .trim()
      .toLowerCase(),
    password: z
      .string({ message: "Password wajib diisi" })
      .min(8, "Password minimal 8 karakter")
      .max(100, "Password maksimal 100 karakter")
      .regex(
        passwordRegex,
        "Password harus mengandung huruf besar, huruf kecil, angka, dan simbol"
      ),
    confirmPassword: z
      .string({ message: "Konfirmasi password wajib diisi" })
      .min(1, "Konfirmasi password wajib diisi"),
    schoolId: z
      .string({ message: "Sekolah wajib dipilih" })
      .min(1, "Sekolah wajib dipilih"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password dan konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  })
  .refine((data) => data.password !== data.username, {
    message: "Password tidak boleh sama dengan username",
    path: ["password"],
  })
  .refine((data) => data.password !== data.nisn, {
    message: "Password tidak boleh sama dengan NISN",
    path: ["password"],
  });

// ============================================
// 👥 ADMIN — USER MANAGEMENT
// ============================================

export const createUserSchema = z.object({
  email: z
    .string()
    .email("Format email tidak valid")
    .max(255, "Email terlalu panjang")
    .toLowerCase()
    .trim()
    .optional()
    .or(z.literal("")),
  username: z
    .string({ message: "Username wajib diisi" })
    .min(4, "Username minimal 4 karakter")
    .max(20, "Username maksimal 20 karakter")
    .regex(/^[a-z0-9_]+$/, "Username hanya boleh huruf kecil, angka, dan underscore")
    .trim()
    .toLowerCase(),
  nisn: z
    .string()
    .length(10, "NISN harus 10 digit")
    .regex(/^\d{10}$/, "NISN harus 10 digit angka")
    .trim()
    .optional()
    .or(z.literal("")),
  password: z
    .string({ message: "Password wajib diisi" })
    .min(6, "Password minimal 6 karakter")
    .max(100, "Password maksimal 100 karakter"),
  name: z
    .string()
    .max(100, "Nama maksimal 100 karakter")
    .trim()
    .optional()
    .or(z.literal("")),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"], {
    message: "Role tidak valid",
  }).default("USER"),
  className: z
    .string()
    .max(50, "Kelas maksimal 50 karakter")
    .trim()
    .optional()
    .or(z.literal("")),
  schoolId: z
    .string({ message: "SchoolId wajib diisi" })
    .min(1, "SchoolId wajib diisi"),
});

export const updateUserSchema = z.object({
  name: z
    .string({ message: "Nama wajib diisi" })
    .min(1, "Nama wajib diisi")
    .max(100, "Nama maksimal 100 karakter")
    .trim(),
  email: z
    .string({ message: "Email wajib diisi" })
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid")
    .max(255, "Email terlalu panjang")
    .toLowerCase()
    .trim(),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"], {
    message: "Role tidak valid",
  }),
  className: z
    .string()
    .max(50, "Kelas maksimal 50 karakter")
    .trim()
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .max(100, "Password maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
});

// ============================================
// 📚 BUKU
// ============================================

export const createBookSchema = z.object({
  title: z
    .string({ message: "Judul wajib diisi" })
    .min(1, "Judul wajib diisi")
    .max(255, "Judul maksimal 255 karakter")
    .trim(),
  author: z
    .string({ message: "Penulis wajib diisi" })
    .min(1, "Penulis wajib diisi")
    .max(100, "Penulis maksimal 100 karakter")
    .trim(),
  description: z
    .string()
    .max(5000, "Deskripsi maksimal 5000 karakter")
    .optional()
    .nullable(),
  coverUrl: z.string().max(500).optional().nullable(),
  fileUrl: z.string().max(500).optional().nullable(),
  year: z.string().max(10).optional().nullable(),
  schoolId: z
    .string({ message: "SchoolId wajib diisi" })
    .min(1, "SchoolId wajib diisi"),
  categories: z.array(z.string()).optional().default([]),
  isShared: z.boolean().optional().default(true),
});

// ============================================
// 📕 BUKU FISIK
// ============================================

export const createBukuFisikSchema = z.object({
  judul: z
    .string({ message: "Judul wajib diisi" })
    .min(1, "Judul wajib diisi")
    .max(255, "Judul maksimal 255 karakter")
    .trim(),
  penulis: z
    .string({ message: "Penulis wajib diisi" })
    .min(1, "Penulis wajib diisi")
    .max(100, "Penulis maksimal 100 karakter")
    .trim(),
  penerbit: z.string().max(100).optional().nullable(),
  tahun: z.string().max(10).optional().nullable(),
  isbn: z.string().max(50).optional().nullable(),
  lokasiRak: z.string().max(50).optional().nullable(),
  stok: z
    .union([z.string(), z.number()])
    .transform((val) => parseInt(String(val)) || 1)
    .pipe(z.number().int().min(1, "Stok minimal 1")),
  deskripsi: z.string().max(5000).optional().nullable(),
  schoolId: z.string().min(1, "SchoolId wajib diisi"),
});

// ============================================
// 🔐 CHANGE PASSWORD
// ============================================

export const changePasswordSchema = z.object({
  id: z
    .string({ message: "ID user wajib diisi" })
    .min(1, "ID user wajib diisi"),
  currentPassword: z
    .string({ message: "Password saat ini wajib diisi" })
    .min(1, "Password saat ini wajib diisi")
    .max(100, "Password terlalu panjang"),
  newPassword: z
    .string({ message: "Password baru wajib diisi" })
    .min(6, "Password baru minimal 6 karakter")
    .max(100, "Password baru maksimal 100 karakter"),
});

// ============================================
// 👤 USER — UPDATE PROFILE
// ============================================

export const updateProfileSchema = z.object({
  id: z
    .string({ message: "ID user wajib diisi" })
    .min(1, "ID user wajib diisi"),
  name: z
    .string()
    .max(100, "Nama maksimal 100 karakter")
    .trim()
    .optional(),
  className: z
    .string()
    .max(50, "Kelas maksimal 50 karakter")
    .trim()
    .optional(),
  email: z
    .string()
    .max(255, "Email maksimal 255 karakter")
    .toLowerCase()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || val === "" || z.string().email().safeParse(val).success,
      { message: "Format email tidak valid" }
    ),
  password: z
    .string()
    .max(100, "Password maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
});

// ============================================
// 🔐 ADMIN — RESET PASSWORD
// ============================================

export const resetPasswordSchema = z.object({
  userId: z
    .string({ message: "User ID wajib diisi" })
    .min(1, "User ID wajib diisi"),
  newPassword: z
    .string({ message: "Password baru wajib diisi" })
    .min(6, "Password baru minimal 6 karakter")
    .max(100, "Password baru maksimal 100 karakter"),
});

// ============================================
// 👥 ADMIN — UPDATE USER BY ID
// ============================================

export const adminUpdateUserSchema = z.object({
  name: z
    .string({ message: "Nama wajib diisi" })
    .min(1, "Nama wajib diisi")
    .max(100, "Nama maksimal 100 karakter")
    .trim(),
  email: z
    .string()
    .email("Format email tidak valid")
    .max(255, "Email terlalu panjang")
    .toLowerCase()
    .trim()
    .optional()
    .or(z.literal("")),
  username: z
    .string()
    .min(4, "Username minimal 4 karakter")
    .max(20, "Username maksimal 20 karakter")
    .regex(/^[a-z0-9_]+$/, "Username hanya boleh huruf kecil, angka, dan underscore")
    .trim()
    .toLowerCase()
    .optional()
    .or(z.literal("")),
  nisn: z
    .string()
    .length(10, "NISN harus 10 digit")
    .regex(/^\d{10}$/, "NISN harus 10 digit angka")
    .trim()
    .optional()
    .or(z.literal("")),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"], {
    message: "Role tidak valid",
  }),
  className: z
    .string()
    .max(50, "Kelas maksimal 50 karakter")
    .trim()
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .max(100, "Password maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
});

// ============================================
// 👤 ADMIN — UPDATE PROFILE (self)
// ============================================

export const adminProfileSchema = z.object({
  id: z
    .string({ message: "ID admin wajib diisi" })
    .min(1, "ID admin wajib diisi"),
  name: z
    .string()
    .max(100, "Nama maksimal 100 karakter")
    .trim()
    .optional(),
  email: z
    .string()
    .email("Format email tidak valid")
    .max(255, "Email terlalu panjang")
    .toLowerCase()
    .trim()
    .optional(),
  currentPassword: z
    .string()
    .max(100, "Password maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
  newPassword: z
    .string()
    .max(100, "Password maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
});

// ============================================
// 📂 KATEGORI
// ============================================

export const createKategoriSchema = z.object({
  name: z
    .string({ message: "Nama kategori wajib diisi" })
    .min(1, "Nama kategori tidak boleh kosong")
    .max(50, "Nama kategori maksimal 50 karakter")
    .trim(),
});

// ============================================
// 🏫 SEKOLAH
// ============================================

export const createSchoolSchema = z.object({
  name: z
    .string({ message: "Nama sekolah wajib diisi" })
    .min(1, "Nama sekolah wajib diisi")
    .max(100, "Nama sekolah maksimal 100 karakter")
    .trim(),
  slug: z
    .string({ message: "Slug wajib diisi" })
    .min(1, "Slug wajib diisi")
    .max(100, "Slug maksimal 100 karakter")
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan strip")
    .trim(),
  logo: z
    .string()
    .max(500, "URL logo maksimal 500 karakter")
    .optional()
    .nullable(),
});

// ============================================
// 🖼️ GALERI
// ============================================

export const createGallerySchema = z.object({
  title: z
    .string({ message: "Judul wajib diisi" })
    .min(1, "Judul wajib diisi")
    .max(255, "Judul maksimal 255 karakter")
    .trim(),
  description: z
    .string()
    .max(1000, "Deskripsi maksimal 1000 karakter")
    .optional()
    .nullable(),
  imageUrl: z
    .string({ message: "URL gambar wajib diisi" })
    .min(1, "URL gambar wajib diisi")
    .max(500, "URL gambar maksimal 500 karakter"),
  category: z
    .string()
    .max(50, "Kategori maksimal 50 karakter")
    .optional()
    .default("kegiatan"),
  schoolId: z
    .string({ message: "SchoolId wajib diisi" })
    .min(1, "SchoolId wajib diisi"),
});

// ============================================
// 📚 BUKU (UPDATE — untuk PUT)
// ============================================

export const updateBookSchema = z.object({
  title: z
    .string({ message: "Judul wajib diisi" })
    .min(1, "Judul wajib diisi")
    .max(255, "Judul maksimal 255 karakter")
    .trim(),
  author: z
    .string({ message: "Penulis wajib diisi" })
    .min(1, "Penulis wajib diisi")
    .max(100, "Penulis maksimal 100 karakter")
    .trim(),
  year: z.string().max(10).optional().nullable(),
  description: z
    .string()
    .max(5000, "Deskripsi maksimal 5000 karakter")
    .optional()
    .nullable(),
  categories: z.array(z.string()).optional().default([]),
  isShared: z.boolean().optional(),
});

// ============================================
// 👥 ORGANISASI (FormData)
// ============================================

export const createOrganisasiSchema = z.object({
  name: z
    .string({ message: "Nama wajib diisi" })
    .min(1, "Nama wajib diisi")
    .max(100, "Nama maksimal 100 karakter")
    .trim(),
  position: z
    .string({ message: "Jabatan wajib diisi" })
    .min(1, "Jabatan wajib diisi")
    .max(100, "Jabatan maksimal 100 karakter")
    .trim(),
  order: z.coerce.number().int().min(0).default(0),
});

// ============================================
// 📕 BUKU FISIK
// ============================================

export const updateBukuFisikSchema = z.object({
  judul: z
    .string({ message: "Judul wajib diisi" })
    .min(1, "Judul wajib diisi")
    .max(255, "Judul maksimal 255 karakter")
    .trim(),
  penulis: z
    .string({ message: "Penulis wajib diisi" })
    .min(1, "Penulis wajib diisi")
    .max(100, "Penulis maksimal 100 karakter")
    .trim(),
  penerbit: z.string().max(100).optional().nullable(),
  tahun: z.string().max(10).optional().nullable(),
  isbn: z.string().max(50).optional().nullable(),
  lokasiRak: z.string().max(50).optional().nullable(),
  stok: z.coerce.number().int().min(1, "Stok minimal 1"),
  deskripsi: z.string().max(5000).optional().nullable(),
});

// ============================================
// 📂 BUKU FISIK — KATEGORI
// ============================================

export const bukuFisikKategoriSchema = z.object({
  kategoriIds: z
    .array(z.string())
    .optional()
    .default([]),
});

// ============================================
// 📚 PEMINJAMAN
// ============================================

export const createPeminjamanSchema = z.object({
  userId: z
    .string({ message: "User ID wajib diisi" })
    .min(1, "User ID wajib diisi"),
  bukuFisikId: z
    .string({ message: "Buku ID wajib diisi" })
    .min(1, "Buku ID wajib diisi"),
});

export const returnPeminjamanSchema = z.object({
  id: z
    .string({ message: "ID peminjaman wajib diisi" })
    .min(1, "ID peminjaman wajib diisi"),
});

// ============================================
// ⚙️ SETTINGS
// ============================================

export const updateSettingSchema = z.object({
  key: z
    .string({ message: "Key wajib diisi" })
    .min(1, "Key wajib diisi")
    .max(100, "Key maksimal 100 karakter")
    .trim(),
  value: z
    .string()
    .max(1000, "Value maksimal 1000 karakter")
    .optional()
    .default(""),
});

// ============================================
// 🏫 TENTANG SEKOLAH
// ============================================

export const updateTentangSchema = z.object({
  schoolId: z
    .string({ message: "SchoolId wajib diisi" })
    .min(1, "SchoolId wajib diisi"),
  vision: z.string().max(2000).optional().nullable(),
  mission: z.string().max(5000).optional().nullable(),
  history: z.string().max(5000).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().max(255).optional().nullable(),
  website: z.string().max(500).optional().nullable(),
});

// ============================================
// HELPER
// ============================================

/**
 * Format error Zod jadi pesan yang rapi.
 */
export function formatZodError(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  return firstIssue?.message || "Data tidak valid";
}