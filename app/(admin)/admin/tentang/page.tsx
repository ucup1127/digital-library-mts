// app/(admin)/admin/tentang/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { 
  Info, 
  Save, 
  Target, 
  ClipboardList, 
  ScrollText, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Eye,
  RefreshCw
} from "lucide-react";

interface TentangData {
  vision: string;
  mission: string;
  history: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  school: {
    name: string;
    logo: string;
  };
}

export default function KelolaTentangPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  const [userRole, setUserRole] = useState("");
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
    const role = localStorage.getItem("user_role") || "";
    setUserRole(role);
    
    let schoolId = "";
    let schoolName = "";
    
    if (role === "SUPER_ADMIN") {
      schoolId = localStorage.getItem("selected_school_id") || "";
      schoolName = localStorage.getItem("selected_school_name") || "";
    } else {
      schoolId = localStorage.getItem("school_id") || "";
      schoolName = localStorage.getItem("school_name") || "";
    }
    
    setSelectedSchoolId(schoolId);
    setSelectedSchoolName(schoolName);
    
    if (schoolId) {
      fetchTentang(schoolId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchTentang = async (schoolId: string) => {
    try {
      const res = await fetch(`/api/admin/tentang?schoolId=${schoolId}`);
      const data = await res.json();
      
      if (data && !data.error) {
        setFormData({
          vision: data.vision || "",
          mission: data.mission || "",
          history: data.history || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
        });
      }
    } catch (error) {
      console.error("Error fetching tentang:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSchoolId) {
      toast.error("School ID tidak ditemukan. Silakan pilih sekolah terlebih dahulu.");
      return;
    }
    
    setSaving(true);
    toast.loading("Menyimpan perubahan...", { id: "save" });

    try {
      const payload = {
        schoolId: selectedSchoolId,
        vision: formData.vision,
        mission: formData.mission,
        history: formData.history,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
      };
      
      const res = await fetch("/api/admin/tentang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("✅ Data berhasil disimpan!", { id: "save" });
      } else {
        toast.error(data.error || "Gagal menyimpan data", { id: "save" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "save" });
    } finally {
      setSaving(false);
    }
  };

  // Dengarkan event schoolChanged (untuk SUPER_ADMIN)
  useEffect(() => {
    const handleSchoolChange = (event: any) => {
      const newSchoolId = event.detail?.schoolId;
      const newSchoolName = event.detail?.schoolName;
      
      if (newSchoolId) {
        setSelectedSchoolId(newSchoolId);
        setSelectedSchoolName(newSchoolName);
        setLoading(true);
        fetchTentang(newSchoolId);
      }
    };
    
    window.addEventListener("schoolChanged", handleSchoolChange);
    return () => window.removeEventListener("schoolChanged", handleSchoolChange);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!selectedSchoolId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Info className="w-6 h-6 text-blue-600" />
              Kelola Halaman Tentang
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Kelola konten halaman tentang perpustakaan</p>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-8 text-center">
          <div className="text-5xl mb-3">🏫</div>
          <h2 className="text-lg font-semibold text-yellow-700">Belum Memilih Sekolah</h2>
          <p className="text-sm text-yellow-600 mt-1">
            {userRole === "SUPER_ADMIN" 
              ? "Silakan pilih sekolah terlebih dahulu dari dropdown di pojok kanan atas."
              : "Data sekolah tidak ditemukan. Silakan hubungi SUPER_ADMIN."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-600" />
            Kelola Halaman Tentang
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Kelola konten halaman tentang perpustakaan
            {selectedSchoolName && (
              <span className="text-blue-600 ml-1">- {selectedSchoolName}</span>
            )}
          </p>
        </div>
        <Link
          href="/tentang"
          target="_blank"
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200 transition flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Lihat Halaman Publik
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Visi */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <label className="text-sm font-bold text-gray-800">Visi Perpustakaan</label>
          </div>
          <textarea
            value={formData.vision}
            onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
            placeholder="Masukkan visi perpustakaan..."
          />
        </div>

        {/* Misi */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-green-600" />
            </div>
            <label className="text-sm font-bold text-gray-800">Misi Perpustakaan</label>
          </div>
          <textarea
            value={formData.mission}
            onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
            rows={5}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
            placeholder="Tulis misi perpustakaan...&#10;Pisahkan setiap misi dengan baris baru"
          />
          <p className="text-[9px] text-gray-400 mt-1.5">💡 Pisahkan setiap misi dengan baris baru (Enter)</p>
        </div>

        {/* Sejarah */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <ScrollText className="w-4 h-4 text-amber-600" />
            </div>
            <label className="text-sm font-bold text-gray-800">Sejarah Perpustakaan</label>
          </div>
          <textarea
            value={formData.history}
            onChange={(e) => setFormData({ ...formData, history: e.target.value })}
            rows={6}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
            placeholder="Tulis sejarah berdirinya perpustakaan..."
          />
        </div>

        {/* Kontak & Alamat */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-purple-600" />
            </div>
            <label className="text-sm font-bold text-gray-800">Kontak & Alamat</label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                Alamat
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                Telepon
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Tombol Simpan */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              if (selectedSchoolId) {
                setLoading(true);
                fetchTentang(selectedSchoolId);
              }
            }}
            className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preview */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-blue-600" />
          Preview Halaman Publik
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <p><strong>Visi:</strong> {formData.vision ? formData.vision.substring(0, 80) + "..." : "Belum diisi"}</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500">•</span>
            <p><strong>Misi:</strong> {formData.mission.split("\n").filter(m => m.trim()).length} misi</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-500">•</span>
            <p><strong>Sejarah:</strong> {formData.history.length} karakter</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-500">•</span>
            <p><strong>Kontak:</strong> {formData.address ? "✓ Alamat" : ""} {formData.phone ? "✓ Telepon" : ""} {formData.email ? "✓ Email" : ""}</p>
          </div>
        </div>
        <Link 
          href="/tentang" 
          target="_blank" 
          className="inline-flex items-center gap-1 text-blue-600 text-xs hover:underline mt-3"
        >
          Lihat halaman publik →
        </Link>
      </div>
    </div>
  );
}