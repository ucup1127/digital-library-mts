// app/(admin)/admin/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Settings,
  Wrench,
  Database,
  HardDrive,
  Info,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.user || data.user.role !== "SUPER_ADMIN") {
          toast.error("Akses ditolak. Hanya Super Admin!");
          router.push("/admin");
          return;
        }

        setUserRole(data.user.role);
        fetchMaintenanceStatus();
      } catch (error) {
        console.error("Error checking role:", error);
        router.push("/admin");
      }
    };

    checkRole();
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
      const res = await fetch("/api/admin/trigger-backup", { method: "POST" });
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

        toast.success(
          !maintenanceMode
            ? "✅ Maintenance mode AKTIF!"
            : "✅ Maintenance mode NONAKTIF!",
          { id: "maintenance", duration: 3000 }
        );

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-purple-600" />
          Pengaturan
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Kelola konfigurasi sistem (Khusus Super Admin)
        </p>
      </div>

      {/* Maintenance Mode Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Maintenance Mode</h2>
              <p className="text-[10px] text-gray-400">Aktifkan untuk maintenance website</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              {maintenanceMode ? (
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-medium ${maintenanceMode ? "text-yellow-700" : "text-green-700"}`}>
                  {maintenanceMode
                    ? "Maintenance mode AKTIF — Website sedang dalam perbaikan"
                    : "Maintenance mode NONAKTIF — Website dapat diakses normal"}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {maintenanceMode
                    ? "User akan dialihkan ke halaman maintenance"
                    : "User dapat mengakses website seperti biasa"}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleMaintenance}
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-sm disabled:opacity-50 ${
                maintenanceMode
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-yellow-600 text-white hover:bg-yellow-700"
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  {maintenanceMode ? "Nonaktifkan" : "Aktifkan"}
                </>
              )}
            </button>
          </div>

          {maintenanceMode && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700">
                  Saat maintenance mode aktif, semua user (kecuali admin yang login) akan dialihkan ke halaman maintenance. Admin tetap bisa mengakses dashboard untuk melakukan perbaikan.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backup Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Backup Database</h2>
              <p className="text-[10px] text-gray-400">Backup manual atau otomatis setiap hari jam 01:00</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <button
            onClick={handleManualBackup}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <HardDrive className="w-4 h-4" />
                Backup Sekarang
              </>
            )}
          </button>
          <p className="text-[10px] text-gray-400 mt-3">
            Backup akan tersimpan di folder{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-600">/backups</code>
            <br />
            File backup lama (lebih dari 7 hari) akan otomatis dihapus.
          </p>
        </div>
      </div>

      {/* Info Backup */}
      <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-green-800">Info Backup Otomatis</h3>
            <ul className="text-xs text-green-700 mt-1.5 space-y-1">
              <li>• Backup otomatis berjalan setiap hari jam <strong>01:00</strong></li>
              <li>• Data yang di-backup: Sekolah, User, Buku, Kategori, Aktivitas</li>
              <li>• Password <strong>TIDAK</strong> ikut di-backup untuk keamanan</li>
              <li>• File backup disimpan selama <strong>7 hari</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}