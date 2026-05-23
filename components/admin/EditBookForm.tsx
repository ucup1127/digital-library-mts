"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditBookForm({ initialData, categories }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData.categoryIds || []);
  const [formData, setFormData] = useState({
    title: initialData.title || "",
    author: initialData.author || "",
    year: initialData.year || "",
    description: initialData.description || "",
  });

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedCategories.length === 0) {
      alert("Pilih minimal 1 kategori!");
      return;
    }
    
    setLoading(true);

    try {
      const res = await fetch(`/api/buku/${initialData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          categoryIds: selectedCategories,
        }),
      });

      if (res.ok) {
        router.push("/admin/buku");
        router.refresh();
      } else {
        const error = await res.json();
        alert("Gagal update: " + (error.error || ""));
      }
    } catch (error) {
      alert("Gagal update!");
    } finally {
      setLoading(false);
    }
  };

  const getFileName = (url: string | null) => {
    if (!url) return "Tidak ada file";
    return url.split('/').pop() || "File PDF";
  };

  return (
    <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Judul Buku</label>
          <input 
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 font-bold text-sm" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Penulis</label>
            <input 
              value={formData.author}
              onChange={(e) => setFormData({...formData, author: e.target.value})}
              className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Tahun</label>
            <input 
              value={formData.year}
              onChange={(e) => setFormData({...formData, year: e.target.value})}
              className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" 
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Kategori (Bisa pilih lebih dari satu)</label>
          <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-2xl max-h-40 overflow-y-auto border border-gray-100">
            {categories.map((cat: any) => (
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
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Sinopsis</label>
          <textarea 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={4}
            className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
          />
        </div>

        <button 
          disabled={loading}
          type="submit" 
          className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase italic tracking-[0.2em] hover:bg-blue-600 transition-all disabled:bg-gray-300"
        >
          {loading ? "Menyimpan..." : "Perbarui Data →"}
        </button>
      </div>

      <div className="bg-blue-50/50 rounded-[32px] p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-32 h-44 bg-white rounded-xl shadow-md overflow-hidden border border-blue-100">
          {initialData.coverUrl && <img src={initialData.coverUrl} className="w-full h-full object-cover" />}
        </div>
        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
          File PDF: {getFileName(initialData.fileUrl)}
        </p>
        <p className="text-[9px] text-gray-400 italic">
          Untuk ganti file, silakan hapus dan upload ulang
        </p>
      </div>
    </form>
  );
}