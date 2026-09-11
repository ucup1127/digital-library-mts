// app/(public)/bantuan/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function BantuanPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Cara meminjam buku fisik?",
      a: "Login ke akun, buka menu 'Peminjaman Fisik', pilih buku yang stoknya tersedia, lalu klik 'Pinjam Buku'."
    },
    {
      q: "Lupa password?",
      a: "Hubungi petugas perpustakaan untuk reset password. Admin akan memberikan password baru."
    },
    {
      q: "Bisa pinjam berapa buku?",
      a: "Maksimal 2 buku dalam satu waktu. Ini untuk menjaga ketersediaan bagi anggota lain."
    },
    {
      q: "Denda keterlambatan?",
      a: "Rp1.000 per hari per buku. Denda dibayarkan saat mengembalikan buku ke perpustakaan."
    },
    {
      q: "Cara baca buku digital?",
      a: "Klik buku yang ingin dibaca, lalu klik tombol 'Baca Sekarang'. Bisa juga di-download."
    },
    {
      q: "Email notifikasi tidak masuk?",
      a: "Cek folder Spam atau Promotions. Jika masih tidak ada, hubungi admin untuk update email."
    },
    {
      q: "Bisa perpanjang masa pinjam?",
      a: "Bisa dengan mengembalikan buku lalu meminjam ulang, asalkan tidak ada antrian."
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-5">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Pusat Bantuan</h1>
          <p className="text-gray-500 text-sm mt-2">Pertanyaan yang sering diajukan</p>
          <div className="w-16 h-0.5 bg-blue-500 mx-auto mt-3 rounded-full"></div>
        </div>

        {/* Kontak langsung */}
        <div className="bg-blue-50 rounded-2xl p-5 mb-6 text-center">
          <p className="text-gray-700 text-sm mb-1">📞 Butuh bantuan langsung?</p>
          <p className="text-gray-500 text-xs mb-3">Hubungi petugas perpustakaan</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="mailto:perpustakaan@mtsmpatikraja.sch.id" className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition">
              Email Petugas
            </a>
            <Link href="/" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300 transition">
              Kembali ke Beranda
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-100 last:border-0">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-5 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition"
              >
                <span className="text-sm font-medium text-gray-800">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openFaq === index ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === index && (
                <div className="px-5 pb-4">
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-blue-500 text-sm hover:underline">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}