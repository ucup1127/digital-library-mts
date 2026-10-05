// app/(public)/bantuan/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  ChevronDown,
  Mail,
  MessageCircle,
  ArrowLeft,
  Sparkles,
  Search,
} from "lucide-react";

export default function BantuanPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      category: "Akun & Login",
      q: "Bagaimana cara mendaftar akun?",
      a: "Buka halaman Register, isi NISN (10 digit angka), nama lengkap, kelas, asal sekolah, username, dan password. Pastikan password memenuhi ketentuan: minimal 8 karakter dengan huruf besar, huruf kecil, angka, dan simbol. Setelah berhasil, Anda akan diarahkan ke halaman login.",
    },
    {
      category: "Akun & Login",
      q: "Apa itu NISN dan di mana saya bisa menemukannya?",
      a: "NISN (Nomor Induk Siswa Nasional) adalah nomor unik 10 digit yang diberikan Kementerian Pendidikan kepada setiap siswa. NISN bisa dilihat di kartu pelajar, rapor, atau ditanyakan ke wali kelas / petugas tata usaha sekolah.",
    },
    {
      category: "Akun & Login",
      q: "Lupa password, bagaimana cara reset?",
      a: "Hubungi petugas perpustakaan atau admin sekolah. Admin dapat mereset password Anda melalui panel admin. Setelah direset, segera login dan ganti password melalui menu Akun Saya.",
    },
    {
      category: "Akun & Login",
      q: "Apakah akun saya bisa digunakan di HP?",
      a: "Ya! Aplikasi ini responsif dan dapat diakses dari HP, tablet, maupun komputer. Cukup buka browser (Chrome/Safari/Edge) dan login menggunakan username & password Anda.",
    },
    {
      category: "Buku Digital",
      q: "Bagaimana cara membaca buku digital?",
      a: "Login terlebih dahulu, lalu buka halaman Beranda. Pilih buku yang ingin dibaca dengan mengklik cover-nya, kemudian klik tombol 'Baca Sekarang'. PDF akan terbuka langsung di browser. Anda juga bisa mengunduhnya untuk dibaca offline.",
    },
    {
      category: "Buku Digital",
      q: "Apakah buku digital bisa diunduh?",
      a: "Bisa. Klik tombol 'Download PDF' di halaman detail buku. File akan tersimpan di perangkat Anda. Ingat: unduhan hanya untuk keperluan pribadi dan tidak boleh disebarluaskan.",
    },
    {
      category: "Buku Digital",
      q: "Kenapa PDF tidak muncul saat saya klik 'Baca'?",
      a: "Pastikan Anda sudah login. Kalau sudah login tapi masih tidak muncul, coba (1) refresh halaman, (2) hapus cache browser, (3) coba browser lain. Kalau masih bermasalah, hubungi admin — kemungkinan file PDF sedang tidak tersedia.",
    },
    {
      category: "Peminjaman Buku Fisik",
      q: "Berapa banyak buku fisik yang bisa saya pinjam?",
      a: "Maksimal 2 buku dalam satu waktu. Anda harus mengembalikan buku yang lama sebelum bisa meminjam buku baru.",
    },
    {
      category: "Peminjaman Buku Fisik",
      q: "Berapa lama masa pinjam buku fisik?",
      a: "Masa pinjam adalah 2 hari sejak tanggal peminjaman. Anda bisa memperpanjang dengan konfirmasi ke petugas atau melalui menu akun di web (maksimal 1 kali perpanjangan).",
    },
    {
      category: "Peminjaman Buku Fisik",
      q: "Bagaimana cara mengembalikan buku?",
      a: "Bawa buku fisik ke petugas perpustakaan, lalu sebutkan nama atau NISN Anda. Petugas akan mencatat pengembalian di sistem. Pastikan Anda menerima bukti pengembalian (kalau ada).",
    },
    {
      category: "Peminjaman Buku Fisik",
      q: "Berapa denda keterlambatan?",
      a: "Denda keterlambatan Rp 1.000 per hari per buku. Denda dihitung otomatis oleh sistem dan dibayarkan saat mengembalikan buku ke perpustakaan.",
    },
    {
      category: "Peminjaman Buku Fisik",
      q: "Bisa perpanjang masa pinjam?",
      a: "Bisa, dengan syarat: (1) buku tidak sedang dipesan anggota lain, (2) belum melewati tanggal jatuh tempo, (3) perpanjangan hanya 1 kali per peminjaman. Ajukan lewat menu akun atau konfirmasi ke petugas.",
    },
    {
      category: "Umum",
      q: "Apakah aplikasi ini bisa diakses dari luar sekolah?",
      a: "Ya, bisa diakses dari mana saja selama ada koneksi internet. Login dengan username & password Anda.",
    },
    {
      category: "Umum",
      q: "Data saya aman?",
      a: "Ya. Password Anda dienkripsi dengan bcrypt (satu arah), koneksi menggunakan HTTPS di production, dan akses ke data dibatasi berdasarkan role. Kami tidak pernah membagikan data ke pihak ketiga. Lihat Kebijakan Privasi untuk detail.",
    },
    {
      category: "Umum",
      q: "Bagaimana kalau saya menemukan bug atau punya saran?",
      a: "Silakan hubungi admin atau petugas perpustakaan. Anda juga bisa menghubungi developer melalui kontak yang tertera di footer. Feedback Anda sangat berarti untuk pengembangan aplikasi ini.",
    },
  ];

  const categories = ["Semua", ...Array.from(new Set(faqs.map((f) => f.category)))];
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const filteredFaqs = faqs.filter((faq) => {
    const matchCategory = selectedCategory === "Semua" || faq.category === selectedCategory;
    const matchSearch =
      searchQuery === "" ||
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 overflow-hidden pt-16 pb-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10 mb-4">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            <span className="text-[10px] font-medium text-white uppercase tracking-wider">
              Support
            </span>
          </div>

          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/10">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Pusat Bantuan
          </h1>
          <p className="text-emerald-100 text-sm max-w-2xl mx-auto">
            Temukan jawaban atas pertanyaan yang sering diajukan
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-5 -mt-8 pb-16 pt-10">
        {/* Contact Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200 shrink-0">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-gray-800 text-lg">Butuh bantuan langsung?</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Hubungi petugas perpustakaan di jam kerja
              </p>
            </div>
            <Link
              href="mailto:perpustakaan@sekolah.sch.id"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 transition flex items-center gap-2 shadow-lg shadow-emerald-200"
            >
              <Mail className="w-4 h-4" />
              Email Petugas
            </Link>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pertanyaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredFaqs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-gray-500 text-sm">Tidak ada pertanyaan yang cocok</p>
              <p className="text-gray-400 text-xs mt-1">Coba kata kunci lain atau ubah kategori</p>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-100 last:border-0">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-5 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <div className="flex-1 pr-3">
                    <p className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                      {faq.category}
                    </p>
                    <span className="text-sm font-medium text-gray-800">{faq.q}</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 shrink-0 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-4">
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))
          )}
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