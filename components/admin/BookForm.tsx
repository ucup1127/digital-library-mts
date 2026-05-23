"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
}

export default function BookForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    year: "",
    description: "",
    pdfFile: null as File | null,
    coverFile: null as File | null,
  });

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedCategories.length === 0) {
      toast.error("Pilih minimal 1 kategori!");
      return;
    }
    
    setLoading(true);

    const submitData = new FormData();
    submitData.append("title", formData.title);
    submitData.append("author", formData.author);
    submitData.append("year", formData.year || "");
    submitData.append("description", formData.description || "");
    submitData.append("schoolId", "1");
    
    // Kirim categories SATU PER SATU
    selectedCategories.forEach(catId => {
      submitData.append("categoryIds[]", catId);
    });
    
    if (formData.pdfFile) submitData.append("pdf", formData.pdfFile);
    if (formData.coverFile) submitData.append("cover", formData.coverFile);

    // Debug
    console.log("Sending categories:", selectedCategories);

    try {
      const res = await fetch("/api/buku", {
        method: "POST",
        body: submitData,
      });

      const result = await res.json();
      
      if (res.ok) {
        toast.success("Buku berhasil ditambahkan!");
        router.push("/admin/buku");
        router.refresh();
      } else {
        toast.error("Gagal: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan, coba lagi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
      <div className="space-y-2">
        <label className="text-sm font-black uppercase tracking-widest text-gray-400">Judul Buku *</label>
        <input 
          required
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 font-medium text-sm"
          placeholder="Contoh: Matematika Kelas 7"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-black uppercase tracking-widest text-gray-400">Penulis *</label>
        <input 
          required
          value={formData.author}
          onChange={(e) => setFormData({...formData, author: e.target.value})}
          className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 font-medium text-sm"
          placeholder="Contoh: Tim Kemendikbud"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-black uppercase tracking-widest text-gray-400">Tahun</label>
          <input 
            value={formData.year}
            onChange={(e) => setFormData({...formData, year: e.target.value})}
            className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 font-medium text-sm"
            placeholder="2024"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-black uppercase tracking-widest text-gray-400">File PDF *</label>
          <input 
            type="file"
            accept=".pdf"
            required
            onChange={(e) => setFormData({...formData, pdfFile: e.target.files?.[0] || null})}
            className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 font-medium text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-black uppercase tracking-widest text-gray-400">
          Kategori (Bisa pilih lebih dari satu) *
        </label>
        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-2xl max-h-40 overflow-y-auto border border-gray-100">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded-lg transition">
              <input
                type="checkbox"
                value={cat.id}
                checked={selectedCategories.includes(cat.id)}
                onChange={() => handleCategoryToggle(cat.id)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">{cat.name}</span>
            </label>
          ))}
        </div>
        {selectedCategories.length === 0 && (
          <p className="text-xs text-red-500 ml-2">⚠️ Pilih minimal 1 kategori</p>
        )}
        {selectedCategories.length > 0 && (
          <p className="text-xs text-green-500 ml-2">✓ Terpilih {selectedCategories.length} kategori</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-black uppercase tracking-widest text-gray-400">Cover Buku (Opsional)</label>
        <input 
          type="file"
          accept="image/*"
          onChange={(e) => setFormData({...formData, coverFile: e.target.files?.[0] || null})}
          className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 font-medium text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-black uppercase tracking-widest text-gray-400">Sinopsis</label>
        <textarea 
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 font-medium text-sm"
          placeholder="Tuliskan ringkasan buku..."
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full py-5 bg-gray-900 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-sm hover:bg-blue-600 transition-all shadow-xl shadow-gray-100 disabled:bg-gray-400"
      >
        {loading ? "Menyimpan..." : "Simpan Koleksi Baru"}
      </button>
    </form>
  );
}