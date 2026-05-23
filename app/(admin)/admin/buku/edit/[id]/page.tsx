// app/(admin)/admin/buku/edit/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { logAdminActivity } from "@/lib/admin-log";

interface Category {
  id: string;
  name: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  year: string;
  description: string;
  coverUrl: string;
  fileUrl: string;
  categories: { categoryId: string }[];
}

export default function EditBukuPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [bookId, setBookId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    year: "",
    description: "",
  });
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Ambil ID dari params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setBookId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  // Ambil data buku dan kategori
  useEffect(() => {
    if (!bookId) return;
    
    const fetchData = async () => {
      try {
        const [bookRes, catRes] = await Promise.all([
          fetch(`/api/buku/${bookId}`),
          fetch("/api/kategori"),
        ]);
        
        const book = await bookRes.json();
        const categoriesData = await catRes.json();
        
        setCategories(categoriesData);
        setFormData({
          title: book.title || "",
          author: book.author || "",
          year: book.year || "",
          description: book.description || "",
        });
        setSelectedCategories(book.categories?.map((c: any) => c.categoryId) || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [bookId]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!formData.title.trim()) {
    toast.error("Judul buku harus diisi!");
    return;
  }
  if (!formData.author.trim()) {
    toast.error("Penulis harus diisi!");
    return;
  }
  if (selectedCategories.length === 0) {
    toast.error("Pilih minimal 1 kategori!");
    return;
  }
  
  // Pastikan bookId ada
  if (!bookId) {
    toast.error("ID buku tidak ditemukan!");
    return;
  }
  
  setSaving(true);
  toast.loading("Menyimpan perubahan...", { id: "save" });
  
  try {
    const res = await fetch(`/api/buku/${bookId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.title,
        author: formData.author,
        year: formData.year || null,
        description: formData.description || null,
        categories: selectedCategories,
      }),
    });
    
    const data = await res.json();
    
    if (res.ok) {
      await logAdminActivity({
        action: "UPDATE",
        targetType: "BOOK",
        targetId: bookId, // ✅ Sekarang pasti ada karena sudah dicek
        targetName: formData.title,
        changes: { new: formData },
      });
      toast.success("✅ Buku berhasil diperbarui!", { id: "save" });
      router.push("/admin/buku");
    } else {
      throw new Error(data.error || "Gagal memperbarui buku");
    }
  } catch (error: any) {
    console.error("Error:", error);
    toast.error(error.message || "Terjadi kesalahan", { id: "save" });
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/buku" className="text-sm text-gray-400 hover:text-blue-600 flex items-center gap-1 mb-4">
          ← Kembali ke Kelola Buku
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Edit Buku</h1>
        <p className="text-xs text-gray-400 mt-1">Perbarui informasi katalog digital</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Grid 2 kolom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Judul Buku */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Judul Buku <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            {/* Penulis */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Penulis <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            {/* Tahun */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tahun
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="2024"
              />
            </div>

            {/* Deskripsi - full width */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Deskripsi / Sinopsis
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                placeholder="Tulis sinopsis atau deskripsi buku di sini..."
              />
            </div>
          </div>

          {/* Kategori Section */}
          <div className="border-t border-gray-100 pt-6">
            <label className="block text-xs font-semibold text-gray-700 mb-3">
              Kategori <span className="text-red-500">*</span>
              <span className="text-[9px] text-gray-400 ml-2">(Bisa pilih lebih dari satu)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                    selectedCategories.includes(category.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700">{category.name}</span>
                </label>
              ))}
            </div>
            <p className="text-[9px] text-gray-400 mt-2">
              Terpilih {selectedCategories.length} kategori
            </p>
          </div>

          {/* Action Buttons - Hanya Simpan dan Batal, tanpa tombol hapus */}
          <div className="border-t border-gray-100 pt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold uppercase tracking-wider hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                "💾 Simpan Perubahan"
              )}
            </button>
            <Link
              href="/admin/buku"
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold uppercase tracking-wider hover:bg-gray-200 transition text-center"
            >
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}