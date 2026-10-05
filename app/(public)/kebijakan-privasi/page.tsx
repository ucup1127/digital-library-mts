// app/(public)/kebijakan-privasi/page.tsx
"use client";

import Link from "next/link";
import {
  Shield,
  Database,
  Lock,
  UserX,
  FileText,
  Mail,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export default function KebijakanPrivasiPage() {
  const sections = [
    {
      icon: Database,
      color: "from-blue-500 to-blue-600",
      shadow: "shadow-blue-200",
      title: "Data yang Kami Kumpulkan",
      content: (
        <>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Saat Anda menggunakan layanan perpustakaan digital, kami mengumpulkan informasi berikut:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2 items-start">
              <span className="text-blue-500 font-bold">•</span>
              <span><strong className="text-gray-800">Identitas:</strong> NISN, nama lengkap, kelas, asal sekolah</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-blue-500 font-bold">•</span>
              <span><strong className="text-gray-800">Akun:</strong> Username, password (terenkripsi), nomor anggota</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-blue-500 font-bold">•</span>
              <span><strong className="text-gray-800">Aktivitas:</strong> Riwayat bacaan, peminjaman buku fisik, log kunjungan</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-blue-500 font-bold">•</span>
              <span><strong className="text-gray-800">Teknis:</strong> Alamat IP, jenis perangkat, waktu akses</span>
            </li>
          </ul>
        </>
      ),
    },
    {
      icon: FileText,
      color: "from-green-500 to-emerald-600",
      shadow: "shadow-green-200",
      title: "Bagaimana Data Digunakan",
      content: (
        <>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Informasi yang kami kumpulkan digunakan <strong>hanya untuk keperluan internal perpustakaan</strong>:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2 items-start">
              <span className="text-green-500 font-bold">✓</span>
              <span>Memproses peminjaman dan pengembalian buku</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-green-500 font-bold">✓</span>
              <span>Menampilkan riwayat bacaan dan rekomendasi buku</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-green-500 font-bold">✓</span>
              <span>Meningkatkan kualitas layanan perpustakaan</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-green-500 font-bold">✓</span>
              <span>Membuat laporan statistik anonim untuk evaluasi</span>
            </li>
          </ul>
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 mt-3">
            <p className="text-xs text-green-700">
              🛡️ Kami <strong>tidak pernah menjual, menyewakan, atau membagikan</strong> data Anda kepada pihak ketiga.
            </p>
          </div>
        </>
      ),
    },
    {
      icon: Lock,
      color: "from-purple-500 to-pink-600",
      shadow: "shadow-purple-200",
      title: "Keamanan Data",
      content: (
        <>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Kami menerapkan standar keamanan berlapis untuk melindungi data Anda:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs font-semibold text-gray-800 mb-1">🔐 Password</p>
              <p className="text-[11px] text-gray-500">Dienkripsi dengan bcrypt (satu arah)</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs font-semibold text-gray-800 mb-1">🌐 Koneksi</p>
              <p className="text-[11px] text-gray-500">HTTPS di production</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs font-semibold text-gray-800 mb-1">🛡️ Akses</p>
              <p className="text-[11px] text-gray-500">Role-based (Siswa, Admin, Super Admin)</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs font-semibold text-gray-800 mb-1">💾 Backup</p>
              <p className="text-[11px] text-gray-500">Backup rutin harian</p>
            </div>
          </div>
        </>
      ),
    },
    {
      icon: UserX,
      color: "from-amber-500 to-orange-600",
      shadow: "shadow-amber-200",
      title: "Hak Anda",
      content: (
        <>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Sebagai pengguna, Anda memiliki hak-hak berikut:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2 items-start">
              <span className="text-amber-500 font-bold">→</span>
              <span><strong className="text-gray-800">Akses:</strong> Melihat data pribadi yang tersimpan di akun Anda</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-amber-500 font-bold">→</span>
              <span><strong className="text-gray-800">Perbaikan:</strong> Meminta update data yang tidak akurat</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-amber-500 font-bold">→</span>
              <span><strong className="text-gray-800">Hapus:</strong> Meminta penghapusan akun (hubungi admin)</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-amber-500 font-bold">→</span>
              <span><strong className="text-gray-800">Keberatan:</strong> Menolak penggunaan data untuk tujuan tertentu</span>
            </li>
          </ul>
          <p className="text-gray-500 text-xs mt-3 leading-relaxed">
            Catatan: Riwayat peminjaman akan tetap tersimpan sebagai arsip internal perpustakaan meskipun akun Anda dihapus.
          </p>
        </>
      ),
    },
    {
      icon: Mail,
      color: "from-cyan-500 to-blue-600",
      shadow: "shadow-cyan-200",
      title: "Kontak",
      content: (
        <>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Jika ada pertanyaan tentang kebijakan privasi ini, hubungi:
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-800 mb-1">Petugas Perpustakaan</p>
            <p className="text-xs text-blue-600">
              Silakan datang langsung ke perpustakaan sekolah atau hubungi admin melalui menu Bantuan.
            </p>
            <Link
              href="/bantuan"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-2"
            >
              Buka Pusat Bantuan →
            </Link>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 overflow-hidden pt-16 pb-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10 mb-4">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            <span className="text-[10px] font-medium text-white uppercase tracking-wider">
              Legal
            </span>
          </div>

          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/10">
            <Shield className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Kebijakan Privasi
          </h1>
          <p className="text-blue-100 text-sm max-w-2xl mx-auto">
            Komitmen kami melindungi data dan privasi Anda
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-5 -mt-8 pb-16 pt-10">
        {/* Info card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Terakhir diperbarui</p>
              <p className="text-xs text-gray-500">1 Oktober 2026</p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-5">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg ${section.shadow} shrink-0`}
                >
                  <section.icon className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-bold text-gray-800 text-lg pt-1.5">
                  {section.title}
                </h2>
              </div>
              <div className="pl-0 sm:pl-14">{section.content}</div>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}