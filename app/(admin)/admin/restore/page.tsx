// app/(admin)/admin/restore/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function RestorePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Pilih file backup terlebih dahulu!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("backup", file);

    try {
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Restore berhasil! Halaman akan direfresh.");
        setTimeout(() => {
          router.refresh();
        }, 2000);
      } else {
        toast.error(data.error || "Gagal restore database");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">
          Restore Database
        </h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
          Pulihkan data dari file backup
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleRestore} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              File Backup (.json)
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              required
            />
            <p className="text-[8px] text-gray-400 mt-1">
              Pilih file backup yang sebelumnya sudah diexport
            </p>
          </div>

          <div className="bg-yellow-50 rounded-xl p-4">
            <p className="text-xs text-yellow-700">
              ⚠️ Peringatan: Restore akan menimpa data yang ada saat ini. Pastikan Anda sudah melakukan backup sebelumnya!
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memulihkan...
                </>
              ) : (
                "🔄 Restore Database"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}