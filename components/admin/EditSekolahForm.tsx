// components/admin/EditSekolahForm.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Image from "next/image";
import { logAdminActivity } from "@/lib/admin-log";

interface School {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export default function EditSekolahForm({ school }: { school: School }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(school.logo);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: school.name,
    slug: school.slug,
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(school.logo);

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
        setLogoPreview(reader.result as string);
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
    
    if (!formData.slug.trim()) {
      toast.error("Slug harus diisi!");
      return;
    }
    
    setLoading(true);
    
    try {
      let logoPath = school.logo;
      
      // Upload logo baru jika ada
      if (logoFile) {
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append("logo", logoFile);
        uploadFormData.append("schoolId", school.id);
        
        const uploadRes = await fetch("/api/upload/logo", {
          method: "POST",
          body: uploadFormData,
        });
        
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          logoPath = uploadData.logoPath;
          toast.success("Logo berhasil diupload!");
        } else {
          toast.error(uploadData.error || "Gagal upload logo");
        }
        setUploading(false);
      }
      
      // Update sekolah
      const res = await fetch(`/api/schools/${school.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          logo: logoPath,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
          await logAdminActivity({
          action: "UPDATE",
          targetType: "SCHOOL",
          targetId: school.id,
          targetName: formData.name,
          changes: { 
            old: { name: school.name, slug: school.slug, logo: school.logo },
            new: { name: formData.name, slug: formData.slug, logo: logoPath }
          },
        });
        toast.success("✅ Sekolah berhasil diperbarui!");
        router.push("/admin/sekolah");
        router.refresh();
      } else {
        toast.error(data.error || "Gagal memperbarui sekolah");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Terjadi kesalahan saat memperbarui sekolah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
            Nama Sekolah
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={handleNameChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            placeholder="Contoh: MTs Negeri 1 Kota"
            required
          />
          <p className="text-[8px] text-gray-400 mt-1">Nama lengkap sekolah</p>
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
            Slug
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

        {/* Logo Section */}
        <div>
          <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
            Logo Sekolah
          </label>
          
          {/* Preview logo saat ini */}
          {logoPreview && (
            <div className="mb-3">
              <img 
                src={logoPreview} 
                alt="Logo sekolah" 
                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              />
            </div>
          )}
          
          {/* Tombol upload */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-gray-200 transition"
            >
              {logoPreview ? "Ganti Logo" : "Pilih Logo"}
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
          
          {/* Tombol hapus logo */}
          {logoPreview && (
            <button
              type="button"
              onClick={() => {
                setLogoFile(null);
                setLogoPreview(null);
                toast("Logo akan dihapus saat menyimpan perubahan", {
                  duration: 2000,
                  position: "top-center",
                  icon: "⚠️",
                });
              }}
              className="mt-2 text-[8px] text-red-500 hover:text-red-600 transition"
            >
              Hapus Logo
            </button>
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
              "💾 Simpan Perubahan"
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
  );
}