"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditMemberForm({ initialData }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData.name,
    position: initialData.position,
    order: initialData.order
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/organisasi/${initialData.id}`, {
        method: "PATCH", // Menggunakan API PATCH yang sudah kita buat tadi
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/admin/organisasi");
        router.refresh(); // Segarkan tampilan dashboard
      }
    } catch (error) {
      alert("Waduh, gagal update Jon!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Nama Lengkap</label>
          <input 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 font-bold text-sm" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Jabatan</label>
            <input 
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
              className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Urutan</label>
            <input 
                type="number"
                // Pastikan value tidak pernah NaN, kasih fallback 0 atau string kosong
                value={formData.order ?? ""} 
                onChange={(e) => {
                const val = e.target.value;
                // Jika kosong kasih 0, jika ada isinya baru di-parse
                setFormData({...formData, order: val === "" ? 0 : parseInt(val)});
                }}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" 
            />
            </div>
        </div>

        <button 
          disabled={loading}
          type="submit" 
          className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase italic tracking-[0.2em] hover:bg-blue-600 transition-all disabled:bg-gray-300"
        >
          {loading ? "Menyimpan..." : "Update Anggota →"}
        </button>
      </div>

      <div className="bg-gray-50 rounded-[32px] p-8 flex flex-col items-center justify-center text-center">
         <div className="w-32 h-32 bg-white rounded-3xl shadow-sm overflow-hidden mb-4">
            {initialData.imageUrl ? <img src={initialData.imageUrl} className="w-full h-full object-cover" /> : "👤"}
         </div>
         <p className="text-[9px] text-gray-400 italic">Catatan: Untuk mengganti foto, silakan hapus dan buat ulang anggota baru agar database tetap rapi.</p>
      </div>
    </form>
  );
}