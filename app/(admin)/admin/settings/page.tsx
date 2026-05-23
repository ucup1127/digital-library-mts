// app/(admin)/admin/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [userRole, setUserRole] = useState("");

  // Cek role user
  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role !== "SUPER_ADMIN") {
      toast.error("Akses ditolak. Hanya Super Admin!");
      router.push("/admin");
      return;
    }
    setUserRole(role);
    fetchMaintenanceStatus();
  }, [router]);

  const fetchMaintenanceStatus = async () => {
    try {
      const res = await fetch("/api/settings?key=maintenance_mode");
      const data = await res.json();
      setMaintenanceMode(data.value === "true");
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleManualBackup = async () => {
    setLoading(true);
    toast.loading("Melakukan backup...", { id: "backup" });
    
    try {
      const res = await fetch("/api/admin/auto-backup?token=rahasia_backup_12345");
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`✅ ${data.message}`, { id: "backup" });
      } else {
        toast.error(data.error || "Gagal backup", { id: "backup" });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Terjadi kesalahan", { id: "backup" });
    } finally {
      setLoading(false);
    }
  };

 const handleToggleMaintenance = async () => {
  setSaving(true);
  toast.loading("Menyimpan pengaturan...", { id: "maintenance" });
  
  try {
    const newValue = (!maintenanceMode).toString();
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: "maintenance_mode",
        value: newValue,
      }),
    });
    
    if (res.ok) {
      setMaintenanceMode(!maintenanceMode);
      
      // Refresh cookie dengan reload page
      toast.success(
        !maintenanceMode 
          ? "✅ Maintenance mode AKTIF! Website akan dialihkan ke halaman maintenance." 
          : "✅ Maintenance mode NONAKTIF! Website dapat diakses normal.",
        { id: "maintenance", duration: 3000 }
      );
      
      // Reload untuk mengupdate cookie
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } else {
      throw new Error("Gagal menyimpan");
    }
  } catch (error) {
    console.error("Error:", error);
    toast.error("Gagal menyimpan pengaturan", { id: "maintenance" });
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Pengaturan</h1>
        <p className="text-xs text-gray-400 mt-1">Kelola konfigurasi sistem</p>
      </div>

      {/* Maintenance Mode Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <span className="text-xl">🔧</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Maintenance Mode</h2>
              <p className="text-[9px] text-gray-400">Aktifkan untuk maintenance website</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {maintenanceMode 
                  ? "⚠️ Maintenance mode AKTIF - Website sedang dalam perbaikan"
                  : "✅ Maintenance mode NONAKTIF - Website dapat diakses normal"}
              </p>
              <p className="text-[9px] text-gray-400 mt-1">
                {maintenanceMode 
                  ? "User akan dialihkan ke halaman maintenance"
                  : "User dapat mengakses website seperti biasa"}
              </p>
            </div>
            <button
              onClick={handleToggleMaintenance}
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                maintenanceMode
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-yellow-600 text-white hover:bg-yellow-700"
              } disabled:opacity-50`}
            >
              {saving ? "Menyimpan..." : (maintenanceMode ? "Nonaktifkan" : "Aktifkan")}
            </button>
          </div>
          
          {maintenanceMode && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-700">
                ⚠️ Saat maintenance mode aktif, semua user (kecuali admin yang login) akan dialihkan ke halaman maintenance.
                Admin tetap bisa mengakses dashboard untuk melakukan perbaikan.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Backup Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <span className="text-xl">💾</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Backup Database</h2>
              <p className="text-[9px] text-gray-400">Backup manual atau otomatis setiap hari jam 01:00</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <button
            onClick={handleManualBackup}
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-[11px] font-semibold uppercase tracking-wider hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? "⏳" : "💾"} Backup Sekarang
          </button>
          <p className="text-[9px] text-gray-400 mt-3">
            Backup akan tersimpan di folder <code className="bg-gray-100 px-1">/backups</code><br />
            File backup lama (lebih dari 7 hari) akan otomatis dihapus.
          </p>
        </div>
      </div>

      {/* Info Backup */}
      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
        <div className="flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <div>
            <h3 className="text-sm font-bold text-green-800">Info Backup Otomatis</h3>
            <p className="text-xs text-green-600 mt-1">
              • Backup otomatis berjalan setiap hari jam <strong>01:00</strong><br />
              • Data yang di-backup: Sekolah, User, Buku, Kategori, Aktivitas<br />
              • Password TIDAK ikut di-backup untuk keamanan<br />
              • File backup disimpan selama <strong>7 hari</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}