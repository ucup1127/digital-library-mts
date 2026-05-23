"use server"
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createBook(prevState: any, formData: FormData) {
  const title = String(formData.get("title") || "");
  const author = String(formData.get("author") || "");
  const publisher = String(formData.get("publisher") || ""); // Ambil data baru
  const year = String(formData.get("year") || "");           // Ambil data baru
  const categoryId = String(formData.get("categoryId") || "");
  const description = String(formData.get("description") || "");
  const pdfUrl = String(formData.get("pdfUrl") || "");
  const coverUrl = String(formData.get("coverUrl") || "");

  // Validasi dasar agar tidak crash jika ada input kosong
  if (!title || !author || !categoryId || !pdfUrl) {
    return { message: "Harap isi semua kolom wajib." };
  }

  try {
    await db.book.create({
      data: {
        title,
        author,
        publisher,   // Simpan ke DB
        year,
        categoryId, // Menggunakan ID kategori sesuai revisi dosen
        description,
        pdfUrl,
        coverUrl,
        isRecommended: true,
      },
    });
  } catch (error) {
    console.error("Gagal tambah buku:", error);
    return { message: "Gagal menyimpan ke database." };
  }

  // Refresh data agar muncul di halaman depan
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/katalog");
  
  redirect("/admin");
}