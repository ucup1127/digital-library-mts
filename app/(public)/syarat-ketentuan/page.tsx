// app/(public)/syarat-ketentuan/page.tsx
"use client";

import Link from "next/link";
import {
  FileCheck,
  UserCheck,
  BookOpen,
  Library,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  FileText,
} from "lucide-react";

export default function SyaratKetentuanPage() {
  const sections = [
    {
      icon: UserCheck,
      color: "from-blue-500 to-blue-600",
      shadow: "shadow-blue-200",
      title: "Keanggotaan",
      content: (
        <>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Layanan perpustakaan digital ini terbuka untuk:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2 items-start">
              <span className="text-blue-500 font-bold">•</span>
              <span><strong className="text-gray-800">Siswa aktif</strong> di sekolah yang terdaftar</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-blue-500 font-bold">•</span>
              <span><strong className="text-gray-800">Guru & staf</strong> sekolah yang terdaftar</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-blue-500 font-bold">•</span>
              <span><strong className="text-gray-800">Admin perpustakaan</strong> yang ditunjuk sekolah</span>
            </li>
          </ul>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mt-3">
            <p className="text-xs text-blue-700">
              <strong>Penting:</strong> Setiap anggota bertanggung jawab penuh atas keamanan akun masing-masing. Jangan bagikan username & password ke orang lain.
            </p>
          </div>
        </>
      ),
    },
    {
      icon: Library,
      color: "from-green-500 to-emerald-600",
      shadow: "shadow-green-200",
      title: "Aturan Peminjaman Buku Fisik",
      content: (
        <>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Ketentuan peminjaman buku fisik di perpustakaan:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wider">Jumlah Maksimal</p>
              <p className="text-lg font-bold text-green-800 mt-0.5">2 Buku</p>
              <p className="text-[10px] text-green-600 mt-0.5">per anggota</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wider">Durasi Pinjam</p>
              <p className="text-lg font-bold text-green-800 mt-0.5">2 Hari</p>
              <p className="text-[10px] text-green-600 mt-0.5">dapat diperpanjang</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Denda Keterlambatan</p>
              <p className="text-lg font-bold text-amber-800 mt-0.5">Rp 1.000</p>
              <p className="text-[10px] text-amber-600 mt-0.5">per hari per buku</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
              <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider">Buku Rusak/Hilang</p>
              <p className="text-sm font-bold text-red-800 mt-0.5">Wajib Diganti</p>
              <p className="text-[10px] text-red-600 mt-0.5">dengan buku yang sama</p>
            </div>
          </div>
        </>
      ),
    },
    {
      icon: RefreshCw,
      color: "from-purple-500 to-pink-600",
      shadow: "shadow-purple-200",
      title: "Perpanjangan Peminjaman",
      content: (
        <>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Peminjaman dapat diperpanjang dengan syarat:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2 items-start">
              <span className="text-purple-500 font-bold">→</span>
              <span>Buku <strong className="text-gray-800">tidak sedang dipesan</strong> oleh anggota lain</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-purple-500 font-bold">→</span>
              <span>Konfirmasi ke <strong className="text-gray-800">petugas perpustakaan</strong> langsung, atau</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-purple-500 font-bold">→</span>
              <span>Ajukan perpanjangan melalui <strong className="text-gray-800">menu akun</strong> di web</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-purple-500 font-bold">→</span>
              <span>Perpanjangan <strong className="text-gray-800">hanya 1 kali</strong> per peminjaman</span>
            </li>
          </ul>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 mt-3">
            <p className="text-xs text-purple-700">
              💡 Ajukan perpanjangan <strong>sebelum jatuh tempo</strong> agar tidak kena denda.
            </p>
          </div>
        </>
      ),
    },
    {
      icon: BookOpen,
      color: "from-cyan-500 to-blue-600",
      shadow: "shadow-cyan-200",
      title: "Buku Digital",
      content: (
        <>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Ketentuan penggunaan buku digital:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2 items-start">
              <span className="text-cyan-500 font-bold">✓</span>
              <span>Buku digital dapat dibaca <strong className="text-gray-800">online</strong> setelah login</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-cyan-500 font-bold">✓</span>
              <span>Unduhan hanya untuk <strong className="text-gray-800">keperluan pribadi</strong></span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-cyan-500 font-bold">✓</span>
              <span>Dilarang <strong className="text-gray-800">menyebarluaskan</strong> file buku ke pihak lain</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-cyan-500 font-bold">✓</span>
              <span>Dilarang <strong className="text-gray-800">mengunggah ulang</strong> ke platform lain</span>
            </li>
          </ul>
        </>
      ),
    },
    {
      icon: AlertTriangle,
      color: "from-red-500 to-orange-600",
      shadow: "shadow-red-200",
      title: "Sanksi Pelanggaran",
      content: (
        <>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Pelanggaran terhadap aturan akan dikenakan sanksi bertingkat:
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
              <div className="w-6 h-6 rounded-full bg-yellow-500 text-white text-xs font-bold flex items-center justify-center shrink-0">1</div>
              <div>
                <p className="text-sm font-semibold text-yellow-800">Peringatan</p>
                <p className="text-xs text-yellow-700 mt-0.5">Pelanggaran ringan (terlambat 1-3 hari)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
              <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</div>
              <div>
                <p className="text-sm font-semibold text-orange-800">Penangguhan Akses</p>
                <p className="text-xs text-orange-700 mt-0.5">Pelanggaran sedang (terlambat &gt; 7 hari, denda belum dibayar)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
              <div className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shrink-0">3</div>
              <div>
                <p className="text-sm font-semibold text-red-800">Pemblokiran Permanen</p>
                <p className="text-xs text-red-700 mt-0.5">Pelanggaran berat (menyebar buku digital, buku hilang tanpa konfirmasi)</p>
              </div>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-3 leading-relaxed">
            Keputusan petugas perpustakaan bersifat <strong>mutlak</strong> dan tidak dapat diganggu gugat.
          </p>
        </>
      ),
    },
    {
      icon: FileCheck,
      color: "from-slate-500 to-gray-700",
      shadow: "shadow-slate-200",
      title: "Perubahan Ketentuan",
      content: (
        <>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Perpustakaan berhak mengubah syarat dan ketentuan ini sewaktu-waktu.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Perubahan akan diinformasikan melalui:
          </p>
          <ul className="space-y-2 text-sm text-gray-600 mt-2">
            <li className="flex gap-2 items-start">
              <span className="text-slate-500 font-bold">•</span>
              <span>Pengumuman di website perpustakaan</span>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-slate-500 font-bold">•</span>
              <span>Papan pengumuman di perpustakaan fisik</span>
            </li>
          </ul>
          <p className="text-gray-500 text-xs mt-3 leading-relaxed">
            Dengan terus menggunakan layanan setelah perubahan, Anda dianggap <strong>menyetujui</strong> ketentuan yang diperbarui.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 overflow-hidden pt-16 pb-16">
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
            <FileCheck className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Syarat & Ketentuan
          </h1>
          <p className="text-indigo-100 text-sm max-w-2xl mx-auto">
            Aturan penggunaan layanan perpustakaan digital
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-5 -mt-8 pb-16 pt-10">
        {/* Info card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
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