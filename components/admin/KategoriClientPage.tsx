"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function KategoriClientPage({ initialCategories }: any) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);

    try {
      const res = await fetch("/api/kategori", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setName("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/kategori/${selectedId}`, { 
        method: "DELETE" 
        });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error); 
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
      setIsModalOpen(false);
      setSelectedId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Form Tambah Kategori */}
      <form onSubmit={handleAdd} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex gap-4">
        <input 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tulis nama kategori baru..."
          className="flex-grow p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 font-bold text-sm"
          required
        />
        <button 
          disabled={loading}
          className="bg-gray-900 text-white px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:bg-gray-300"
        >
          {loading ? "..." : "Tambah +"}
        </button>
      </form>

      {/* List Kategori */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {initialCategories.map((cat: any) => (
          <div key={cat.id} className="bg-white p-6 rounded-[32px] border border-gray-100 flex justify-between items-center group hover:border-blue-200 transition-all shadow-sm">
            <div>
              <p className="font-black italic uppercase text-sm tracking-tight text-gray-900">{cat.name}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{cat._count.books} Judul Buku</p>
            </div>
            <button 
              onClick={() => openDeleteModal(cat.id)}
              className="opacity-0 group-hover:opacity-100 text-[10px] font-black uppercase text-red-400 hover:text-red-600 transition-all italic"
            >
              Hapus
            </button>
          </div>
        ))}
      </div>

      {/* CUSTOM POP-UP MODAL (KONSISTEN DENGAN KELOLA BUKU)[cite: 1] */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loading && setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-[40px] p-10 max-w-sm w-full shadow-2xl border border-gray-100 text-center space-y-6 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-3xl">📂</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">Hapus Kategori?</h3>
              <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-widest">
                Kategori ini bakal dihapus permanen. Pastikan nggak ada buku yang pakai kategori ini ya Jon![cite: 1]
              </p>
            </div>
            <div className="flex gap-3">
              <button
                disabled={loading}
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition"
              >
                Batal
              </button>
              <button
                disabled={loading}
                onClick={handleDelete}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition shadow-lg shadow-red-100 disabled:opacity-50"
              >
                {loading ? "Proses..." : "Ya, Hapus!"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}