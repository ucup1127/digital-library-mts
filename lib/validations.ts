// lib/validations.ts
import { z } from "zod";

// ============================================
// 🔐 AUTH
// ============================================

export const loginSchema = z.object({
  email: z
    .string({ message: "Email wajib diisi" })
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid")
    .max(255, "Email terlalu panjang")
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: "Password wajib diisi" })
    .min(1, "Password wajib diisi")
    .max(100, "Password terlalu panjang"),
  role: z.enum(["ADMIN", "USER"], {
    message: "Role tidak valid",
  }).optional(),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
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
  password: z
    .string({ message: "Password wajib diisi" })
    .min(6, "Password minimal 6 karakter")
    .max(100, "Password maksimal 100 karakter"),
  schoolId: z
    .string({ message: "Sekolah wajib dipilih" })
    .min(1, "Sekolah wajib dipilih"),
});

// ============================================
// 👥 ADMIN — USER MANAGEMENT
// ============================================

export const createUserSchema = z.object({
  email: z
    .string({ message: "Email wajib diisi" })
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid")
    .max(255, "Email terlalu panjang")
    .toLowerCase()
    .trim(),
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
  role: z.enum(["USER", "ADMIN"], {
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
  role: z.enum(["USER", "ADMIN"], {
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
  coverUrl: z
    .string()
    .max(500)
    .optional()
    .nullable(),
  fileUrl: z
    .string()
    .max(500)
    .optional()
    .nullable(),
  year: z
    .string()
    .max(10)
    .optional()
    .nullable(),
  schoolId: z
    .string({ message: "SchoolId wajib diisi" })
    .min(1, "SchoolId wajib diisi"),
  categories: z
    .array(z.string())
    .optional()
    .default([]),
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
// HELPER
// ============================================

/**
 * Format error Zod jadi pesan yang rapi.
 */
export function formatZodError(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  return firstIssue?.message || "Data tidak valid";
}