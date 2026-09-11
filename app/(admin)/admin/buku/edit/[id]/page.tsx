// app/(admin)/admin/buku/edit/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { logAdminActivity } from "@/lib/admin-log";
import { 
  ArrowLeft, 
  Save, 
  X, 
  BookOpen,
  User,
  Calendar,
  AlertCircle,
  Sparkles
} from "lucide-react";

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

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setBookId(resolvedParams.id);
    };
    getParams();
  }, [params]);

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
          targetId: bookId,
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">Memuat data buku...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/buku" className="text-sm text-gray-400 hover:text-blue-600 flex items-center gap-1 mb-4 transition">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Kelola Buku
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          Edit Buku
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Perbarui informasi katalog digital</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Grid 2 kolom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Judul Buku */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Judul Buku <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder:text-gray-400"
                required
              />
            </div>

            {/* Penulis */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Penulis <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder:text-gray-400"
                required
              />
            </div>

            {/* Tahun */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Tahun
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder:text-gray-400"
                placeholder="2024"
              />
            </div>

            {/* Deskripsi - full width */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Deskripsi / Sinopsis
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none placeholder:text-gray-400"
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
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                    selectedCategories.includes(category.id)
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
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
              Terpilih <span className="font-semibold text-gray-600">{selectedCategories.length}</span> kategori
            </p>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-100 pt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </button>
            <Link
              href="/admin/buku"
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition text-center"
            >
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}