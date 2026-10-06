// app/(admin)/admin/users/import/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Users,
} from "lucide-react";

interface ImportedUser {
  id: string;
  name: string | null;
  username: string | null;
  nisn: string | null;
  email: string | null;
  role: string;
  className: string | null;
  memberId: string | null;
  password: string;
}

interface FailedRow {
  row: number;
  error: string;
  data: any;
}

export default function ImportUsersPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedUsers, setImportedUsers] = useState<ImportedUser[]>([]);
  const [failedRows, setFailedRows] = useState<FailedRow[]>([]);
  const [schoolId, setSchoolId] = useState<string>("");

  // Ambil schoolId dari localStorage
  useState(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("user_role");
      if (role === "SUPER_ADMIN") {
        setSchoolId(localStorage.getItem("selected_school_id") || "");
      } else {
        setSchoolId(localStorage.getItem("school_id") || "");
      }
    }
  });

  // 🔥 Parse file Excel saat dipilih
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsing(true);
    setImportedUsers([]);
    setFailedRows([]);

    try {
      const XLSX = await import("xlsx");
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (data.length === 0) {
        toast.error("File kosong atau format salah");
        setPreviewData([]);
        return;
      }

      setPreviewData(data);
      toast.success(`${data.length} baris berhasil dibaca`);
    } catch (error) {
      console.error("Parse error:", error);
      toast.error("Gagal membaca file Excel");
      setPreviewData([]);
    } finally {
      setParsing(false);
    }
  };

  // 🔥 Import ke server
  const handleImport = async () => {
    if (!file || previewData.length === 0) {
      toast.error("Pilih file dulu");
      return;
    }

    if (!schoolId) {
      toast.error("Pilih sekolah dulu di sidebar");
      return;
    }

    setImporting(true);
    toast.loading("Mengimport user...", { id: "import" });

    try {
      const res = await fetch("/api/admin/users/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: previewData,
          schoolId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal import", { id: "import" });
        setImporting(false);
        return;
      }

      toast.success(data.message, { id: "import" });
      setImportedUsers(data.importedUsers || []);
      setFailedRows(data.failed || []);
      setPreviewData([]);
      setFile(null);
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan", { id: "import" });
    } finally {
      setImporting(false);
    }
  };

  // 🔥 Download hasil import (dengan password)
  const handleDownloadResult = async () => {
    if (importedUsers.length === 0) return;

    const XLSX = await import("xlsx");

    const rows = importedUsers.map((u, i) => ({
      No: i + 1,
      Nama: u.name || "",
      Username: u.username || "",
      NISN: u.nisn || "",
      Email: u.email || "",
      Role: u.role,
      Kelas: u.className || "",
      "No Anggota": u.memberId || "",
      Password: u.password,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 25 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "User Imported");

    XLSX.writeFile(wb, `hasil-import-user-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Reset
  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
    setImportedUsers([]);
    setFailedRows([]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/users"
          className="text-sm text-gray-400 hover:text-blue-600 flex items-center gap-1 mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Kelola User
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Upload className="w-6 h-6 text-purple-600" />
          Import User Massal
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Upload file Excel untuk menambah banyak user sekaligus
        </p>
      </div>

      {/* Step 1: Download Template */}
      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-blue-800 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Langkah 1: Download Template
            </h3>
            <p className="text-xs text-blue-600 mt-1">
              Gunakan template ini sebagai format file Excel yang benar
            </p>
          </div>
          <a
            href="/api/admin/users/import/template"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download Template
          </a>
        </div>
      </div>

      {/* Step 2: Upload */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Upload className="w-4 h-4 text-purple-600" />
          Langkah 2: Upload File Excel
        </h3>

        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-purple-300 transition">
          {file ? (
            <div className="space-y-2">
              <FileSpreadsheet className="w-12 h-12 text-green-600 mx-auto" />
              <p className="text-sm font-bold text-gray-700">{file.name}</p>
              <p className="text-xs text-gray-400">
                {previewData.length} baris terbaca
              </p>
              <button
                onClick={handleReset}
                className="text-xs text-red-500 hover:underline"
              >
                Hapus file
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-500">
                Pilih file Excel (.xlsx / .xls)
              </p>
              <label className="inline-block px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-purple-700 transition">
                {parsing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Membaca...
                  </span>
                ) : (
                  "Pilih File"
                )}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={parsing}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Preview */}
      {previewData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Preview ({previewData.length} baris)
            </h3>
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:from-purple-700 hover:to-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengimport...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Sekarang
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase">Nama</th>
                  <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase">Username</th>
                  <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase">NISN</th>
                  <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase">Kelas</th>
                  <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase">Role</th>
                  <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {previewData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                    <td className="px-3 py-2">{row.nama || "-"}</td>
                    <td className="px-3 py-2 font-mono">{row.username || "-"}</td>
                    <td className="px-3 py-2 font-mono">{row.nisn || "-"}</td>
                    <td className="px-3 py-2">{row.kelas || "-"}</td>
                    <td className="px-3 py-2">{row.role || "USER"}</td>
                    <td className="px-3 py-2">{row.email || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 4: Hasil Import */}
      {(importedUsers.length > 0 || failedRows.length > 0) && (
        <div className="space-y-4">
          {/* Success */}
          {importedUsers.length > 0 && (
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-green-100 bg-green-50/80 flex items-center justify-between">
                <h3 className="font-bold text-green-800 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Berhasil: {importedUsers.length} user
                </h3>
                <button
                  onClick={handleDownloadResult}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-green-700 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Hasil (Password)
                </button>
              </div>

              <div className="px-5 py-3 bg-yellow-50 border-b border-yellow-100">
                <p className="text-xs text-yellow-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <strong>Penting:</strong> Download file hasil untuk melihat password user. Password hanya ditampilkan SEKALI.
                </p>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase">Nama</th>
                      <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase">Username</th>
                      <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase">Password</th>
                      <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase">Role</th>
                      <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase">No Anggota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {importedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{u.name || "-"}</td>
                        <td className="px-3 py-2 font-mono">@{u.username}</td>
                        <td className="px-3 py-2 font-mono text-green-700 font-bold">{u.password}</td>
                        <td className="px-3 py-2">{u.role}</td>
                        <td className="px-3 py-2 font-mono">{u.memberId || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Failed */}
          {failedRows.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-red-100 bg-red-50/80">
                <h3 className="font-bold text-red-800 text-sm flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Gagal: {failedRows.length} baris
                </h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                {failedRows.map((f, idx) => (
                  <div key={idx} className="px-5 py-3">
                    <p className="text-xs font-bold text-red-700">Baris {f.row}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{f.error}</p>
                    <p className="text-[10px] text-gray-400 mt-1 font-mono">
                      {f.data.nama} | @{f.data.username}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}