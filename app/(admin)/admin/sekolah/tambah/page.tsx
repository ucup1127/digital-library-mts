// app/(admin)/admin/sekolah/tambah/page.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { logAdminActivity } from "@/lib/admin-log";

export default function TambahSekolahPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  let createdSchoolId = "";
  let createdSchoolName = "";

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      name,
      slug: generateSlug(name),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Nama sekolah harus diisi!");
      return;
    }
    
    setLoading(true);
    
    try {
      // Step 1: Buat sekolah dulu (tanpa logo)
      const res = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || "Gagal menambahkan sekolah");
        setLoading(false);
        return;
      }
      
      const schoolId = data.id;
      createdSchoolId = schoolId;
      createdSchoolName = formData.name;
      toast.success("Sekolah berhasil dibuat!");
      
      // Step 2: Upload logo jika ada
      let logoPath = "";
      if (logoFile) {
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append("logo", logoFile);
        uploadFormData.append("schoolId", schoolId);
        
        const uploadRes = await fetch("/api/upload/logo", {
          method: "POST",
          body: uploadFormData,
        });
        
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          logoPath = uploadData.logoPath;
          toast.success("Logo berhasil diupload!");
        } else {
          // ✅ Perbaikan: ganti toast.warning dengan toast.error
          toast.error("Sekolah berhasil dibuat, tapi gagal upload logo: " + (uploadData.error || ""), {
            duration: 4000,
            position: "top-center",
          });
        }
        setUploading(false);
      }
      
      // ✅ Tambahkan logging aktivitas admin
      await logAdminActivity({
        action: "CREATE",
        targetType: "SCHOOL",
        targetId: schoolId,
        targetName: formData.name,
        changes: { 
          name: formData.name, 
          slug: formData.slug,
          logo: logoPath || "tidak ada logo"
        },
      });
      
      // Redirect ke halaman kelola sekolah
      setTimeout(() => {
        router.push("/admin/sekolah");
      }, 1500);
      
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/sekolah" className="text-sm text-gray-400 hover:text-blue-600 flex items-center gap-1 mb-4">
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Tambah Sekolah
        </h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
          Tambah sekolah baru ke sistem
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Nama Sekolah <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Contoh: MTs Negeri 1 Kota"
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono"
              placeholder="Contoh: mts-negeri-1-kota"
              required
            />
            <p className="text-[8px] text-gray-400 mt-1">
              Slug digunakan untuk URL (huruf kecil, pakai - sebagai pemisah)
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Logo Sekolah
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-gray-200 transition"
              >
                Pilih File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
              />
              {logoFile && (
                <span className="text-xs text-gray-500">{logoFile.name}</span>
              )}
            </div>
            {preview && (
              <div className="mt-3">
                <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border" />
              </div>
            )}
            <p className="text-[8px] text-gray-400 mt-1">
              Format: JPEG, PNG, SVG | Maksimal 2MB
            </p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>📤 Upload logo...</>
              ) : loading ? (
                <>💾 Menyimpan...</>
              ) : (
                "💾 Simpan Sekolah"
              )}
            </button>
            <Link
              href="/admin/sekolah"
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-gray-200 transition text-center"
            >
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}