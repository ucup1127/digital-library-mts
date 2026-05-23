// app/(admin)/admin/buku/import/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import * as XLSX from "xlsx"; 

interface School {
  id: string;
  name: string;
}

export default function ImportBukuPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [schoolId, setSchoolId] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Ambil daftar sekolah
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await fetch("/api/schools");
        const data = await res.json();
        setSchools(data);
        if (data.length > 0) setSchoolId(data[0].id);
      } catch (error) {
        console.error("Error fetching schools:", error);
      }
    };
    fetchSchools();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error("Pilih file Excel terlebih dahulu!");
      return;
    }
    
    if (!schoolId) {
      toast.error("Pilih sekolah terlebih dahulu!");
      return;
    }
    
    setLoading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("schoolId", schoolId);
    
    try {
      const res = await fetch("/api/admin/import-buku", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message);
        if (data.successCount > 0) {
          setTimeout(() => {
            router.push("/admin/buku");
          }, 2000);
        }
      } else {
        toast.error(data.error || "Gagal import buku");
      }
      
      if (data.errors && data.errors.length > 0) {
        console.log("Errors:", data.errors);
        toast.error(`${data.errors.length} error terjadi. Cek console untuk detail.`);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  // Download template Excel
  const downloadTemplate = () => {
    const template = [
      {
        "Judul Buku": "Contoh Buku Matematika",
        "Penulis": "Ahmad S",
        "Kategori": "Matematika, Kelas 7",
        "Tahun": "2024",
        "Deskripsi": "Buku pelajaran matematika untuk kelas 7",
        "Cover URL": "https://example.com/cover.jpg",
        "File URL": "https://example.com/buku.pdf",
      },
      {
        "Judul Buku": "Contoh IPA",
        "Penulis": "Budi Santoso, M.Pd",
        "Kategori": "IPA, Kelas 8",
        "Tahun": "2023",
        "Deskripsi": "Buku IPA untuk kelas 8",
        "Cover URL": "",
        "File URL": "",
      },
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Buku");
    XLSX.writeFile(workbook, "template-import-buku.xlsx");
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/buku" className="text-sm text-gray-400 hover:text-blue-600 flex items-center gap-1 mb-4">
          ← Kembali ke Kelola Buku
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Import Buku Massal
        </h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
          Upload file Excel untuk menambah banyak buku sekaligus
        </p>
      </div>

      <div className="grid gap-6">
        {/* Tombol Download Template */}
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-blue-800">📥 Download Template</h3>
              <p className="text-xs text-blue-600 mt-1">
              Gunakan template ini sebagai format file Excel yang benar
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition"
            >
              Download Template
            </button>
          </div>
        </div>

        {/* Form Import */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Pilih Sekolah */}
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                Pilih Sekolah
              </label>
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              >
                <option value="">-- Pilih Sekolah --</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload File */}
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                File Excel (.xlsx / .xls)
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                {file ? (
                  <div className="space-y-2">
                    <div className="text-3xl">📄</div>
                    <p className="text-sm font-bold text-gray-700">{file.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Hapus file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-4xl">📂</div>
                    <p className="text-sm text-gray-500">
                      Drag & drop file Excel di sini
                    </p>
                    <p className="text-[10px] text-gray-400">atau</p>
                    <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-700 transition">
                      Pilih File
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
              <p className="text-[8px] text-gray-400 mt-2">
                Format file: .xlsx atau .xls | Maksimal 10MB
              </p>
            </div>

            {/* Informasi Kolom */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-[9px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                Kolom yang didukung:
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
                <div>✅ <span className="font-bold">Judul Buku</span> *wajib</div>
                <div>✅ <span className="font-bold">Penulis</span> *wajib</div>
                <div>✅ Kategori (pisah dengan koma)</div>
                <div>✅ Tahun</div>
                <div>✅ Deskripsi</div>
                <div>✅ Cover URL</div>
                <div>✅ File URL</div>
              </div>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Mengimport...
                </>
              ) : (
                "📤 Import Buku"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}