// app/(admin)/admin/profil-sekolah/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Image from "next/image";

interface School {
  id: string;
  name: string;
  slug: string;
  logo: string;
}

export default function AdminProfilSekolahPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  
  const [formData, setFormData] = useState({
    vision: "",
    mission: "",
    history: "",
    address: "",
    phone: "",
    email: "",
    website: "",
  });

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const schoolId = localStorage.getItem("school_id");
    
    setUserRole(role || "");
    
    if (!isLoggedIn || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
      router.push("/login/admin");
      return;
    }
    
    // Jika SUPER_ADMIN, ambil daftar semua sekolah
    if (role === "SUPER_ADMIN") {
      fetchAllSchools();
    } else {
      // Jika admin biasa, langsung pakai school_id-nya
      setSelectedSchoolId(schoolId || "");
      setSelectedSchoolName(localStorage.getItem("school_name") || "");
      fetchProfile(schoolId || "");
    }
  }, []);

  const fetchAllSchools = async () => {
    try {
      const res = await fetch("/api/schools");
      const data = await res.json();
      setSchools(data);
      if (data.length > 0) {
        setSelectedSchoolId(data[0].id);
        setSelectedSchoolName(data[0].name);
        fetchProfile(data[0].id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
      toast.error("Gagal memuat daftar sekolah");
      setLoading(false);
    }
  };

  const fetchProfile = async (schoolId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/school-profile?schoolId=${schoolId}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      setFormData({
        vision: data.vision || "",
        mission: data.mission || "",
        history: data.history || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        website: data.website || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Gagal memuat profil sekolah");
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    const school = schools.find(s => s.id === schoolId);
    setSelectedSchoolName(school?.name || "");
    fetchProfile(schoolId);
  };

  const handleSave = async () => {
    setSaving(true);
    toast.loading("Menyimpan perubahan...", { id: "save" });
    
    try {
      const res = await fetch("/api/school-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: selectedSchoolId,
          ...formData,
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      toast.success("✅ Profil sekolah berhasil diperbarui!", { id: "save" });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Gagal menyimpan profil", { id: "save" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Profil Sekolah</h1>
        <p className="text-xs text-gray-400 mt-1">
          {userRole === "SUPER_ADMIN" 
            ? "Kelola profil sekolah (khusus Super Admin)" 
            : "Kelola informasi profil sekolah"}
        </p>
      </div>

      {/* Pilih Sekolah (hanya untuk SUPER_ADMIN) */}
      {userRole === "SUPER_ADMIN" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Pilih Sekolah
          </label>
          <select
            value={selectedSchoolId}
            onChange={(e) => handleSchoolChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Info Sekolah yang sedang diedit */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-center gap-3">
          {selectedSchoolId && (
            <>
              {schools.find(s => s.id === selectedSchoolId)?.logo ? (
                <Image
                  src={schools.find(s => s.id === selectedSchoolId)?.logo || ""}
                  alt={selectedSchoolName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white text-lg">
                  📚
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-800">Sekolah: {selectedSchoolName}</p>
                <p className="text-[10px] text-gray-500">Sedang mengedit profil sekolah ini</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 space-y-6">
          {/* Visi */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Visi
            </label>
            <textarea
              value={formData.vision}
              onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Visi sekolah"
            />
          </div>

          {/* Misi */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Misi
            </label>
            <textarea
              value={formData.mission}
              onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Misi sekolah (pisahkan dengan enter untuk tiap poin)"
            />
          </div>

          {/* Sejarah */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Sejarah
            </label>
            <textarea
              value={formData.history}
              onChange={(e) => setFormData({ ...formData, history: e.target.value })}
              rows={5}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Sejarah berdirinya sekolah"
            />
          </div>

          {/* Alamat */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Alamat
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Alamat lengkap sekolah"
            />
          </div>

          {/* Kontak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Telepon
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="(0281) 123456"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="info@sekolah.sch.id"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="https://sekolah.sch.id"
            />
          </div>

          {/* Tombol Simpan */}
          <div className="border-t border-gray-100 pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "💾 Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}