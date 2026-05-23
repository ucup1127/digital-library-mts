// app/(admin)/admin/buku/tambah/page.tsx
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

export default function TambahBukuPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    year: "",
    description: "",
    coverUrl: "",
    fileUrl: "",
  });
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Ambil daftar kategori
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/kategori");
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
    }
  };

  const uploadFile = async (file: File, type: string): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        return data.url;
      }
      throw new Error(data.error || `Gagal upload ${type}`);
    } catch (error) {
      console.error(`Upload ${type} error:`, error);
      return null;
    }
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
    if (!pdfFile) {
      toast.error("File PDF harus diupload!");
      return;
    }
    if (selectedCategories.length === 0) {
      toast.error("Pilih minimal 1 kategori!");
      return;
    }
    
    setLoading(true);
    setUploading(true);
    toast.loading("Mengupload file...", { id: "upload" });
    
    try {
      // Upload cover jika ada
      let coverUrl = "";
      if (coverFile) {
        const url = await uploadFile(coverFile, "cover");
        if (url) coverUrl = url;
      }
      
      // Upload PDF
      toast.loading("Mengupload file PDF...", { id: "upload" });
      const pdfUrl = await uploadFile(pdfFile, "book");
      if (!pdfUrl) {
        throw new Error("Gagal upload file PDF");
      }
      
      // Simpan data buku
      toast.loading("Menyimpan data buku...", { id: "upload" });
      const schoolId = localStorage.getItem("school_id");
      
      const res = await fetch("/api/buku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          author: formData.author,
          year: formData.year || null,
          description: formData.description || null,
          coverUrl: coverUrl || null,
          fileUrl: pdfUrl,
          schoolId,
          categories: selectedCategories,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        await logAdminActivity({
      action: "CREATE",
      targetType: "BOOK",
      targetId: data.id,
      targetName: formData.title,
      changes: { title: formData.title, author: formData.author, year: formData.year },
    });
        toast.success("✅ Buku berhasil ditambahkan!", { id: "upload" });
        router.push("/admin/buku");
      } else {
        throw new Error(data.error || "Gagal menyimpan buku");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Terjadi kesalahan", { id: "upload" });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/buku" className="text-sm text-gray-400 hover:text-blue-600 flex items-center gap-1 mb-4">
          ← Kembali ke Kelola Buku
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Tambah Buku</h1>
        <p className="text-xs text-gray-400 mt-1">Input data katalog digital</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Grid 2 kolom untuk data dasar */}
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
                placeholder="Contoh: Matematika Kelas 7"
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
                placeholder="Contoh: Tim Kemendikbud"
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
                min="1900"
                max={new Date().getFullYear()}
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
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                placeholder="Tulis sinopsis atau deskripsi buku di sini..."
              />
            </div>
          </div>

          {/* Upload File Section */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Upload File</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cover Buku */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Cover Buku
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-blue-300 transition">
                  {coverPreview ? (
                    <div className="space-y-3">
                      <img src={coverPreview} alt="Cover preview" className="w-32 h-32 object-cover rounded-lg mx-auto shadow-sm" />
                      <button
                        type="button"
                        onClick={() => {
                          setCoverFile(null);
                          setCoverPreview(null);
                        }}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Hapus Cover
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-3xl">🖼️</div>
                      <p className="text-xs text-gray-400">Klik atau drag & drop cover buku</p>
                      <label className="inline-block px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-200 transition">
                        Pilih File
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={handleCoverChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 mt-1">Format: JPEG, PNG | Maksimal 2MB</p>
              </div>

              {/* File PDF */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  File PDF <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-blue-300 transition">
                  {pdfFile ? (
                    <div className="space-y-2">
                      <div className="text-3xl">📄</div>
                      <p className="text-xs font-medium text-gray-700">{pdfFile.name}</p>
                      <p className="text-[9px] text-gray-400">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button
                        type="button"
                        onClick={() => setPdfFile(null)}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Hapus File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-3xl">📑</div>
                      <p className="text-xs text-gray-400">Upload file PDF buku</p>
                      <label className="inline-block px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-200 transition">
                        Pilih File PDF
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handlePdfChange}
                          className="hidden"
                          required
                        />
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 mt-1">Format: PDF | Maksimal 10MB</p>
              </div>
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
            {selectedCategories.length === 0 && (
              <p className="text-[10px] text-orange-500 mt-2">⚠️ Pilih minimal 1 kategori</p>
            )}
            <p className="text-[9px] text-gray-400 mt-2">
              Terpilih {selectedCategories.length} kategori
            </p>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-100 pt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold uppercase tracking-wider hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                "💾 Simpan Buku"
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