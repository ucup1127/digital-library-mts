// components/Footer.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Footer() {
  const [schoolName, setSchoolName] = useState("MTs Muhammadiyah Patikraja");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const name = localStorage.getItem("school_name");
    if (name) setSchoolName(name);
  }, []);

  const quickLinks = [
    { name: "Beranda", href: "/" },
    { name: "Koleksi Buku", href: "/" },
    { name: "Tentang", href: "/tentang" },
    { name: "Galeri", href: "/galeri" },
    { name: "Profil Sekolah", href: "/profil-sekolah" },
  ];

  const layanan = [
    { name: "Peminjaman Buku", href: "/peminjaman" },
    { name: "Baca Online", href: "/" },
    { name: "Rekomendasi Buku", href: "/" },
    { name: "Statistik Perpustakaan", href: "/statistik" },
  ];

  const kontak = [
    { icon: "📍", text: "Jl. Raya Patikraja No. 123, Banyumas" },
    { icon: "📞", text: "(0281) 1234567" },
    { icon: "✉️", text: "perpustakaan@mtsmpatikraja.sch.id" },
    { icon: "🕒", text: "Senin - Jumat: 07:30 - 15:30" },
  ];

  const sosialMedia = [
    { name: "Facebook", icon: "📘", href: "#" },
    { name: "Instagram", icon: "📷", href: "#" },
    { name: "YouTube", icon: "▶️", href: "#" },
    { name: "TikTok", icon: "🎵", href: "#" },
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300 mt-auto">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Kolom 1 - Logo & Deskripsi */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">📚</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{schoolName}</h3>
                <p className="text-[9px] text-gray-400">Perpustakaan Digital</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Perpustakaan digital yang menyediakan akses mudah ke ribuan koleksi buku, 
              jurnal, dan sumber belajar lainnya untuk mendukung kegiatan belajar mengajar.
            </p>
            <div className="flex gap-2 pt-2">
              {sosialMedia.map((medsos, idx) => (
                <a
                  key={idx}
                  href={medsos.href}
                  className="w-7 h-7 rounded-full bg-gray-700/50 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all duration-300"
                  aria-label={medsos.name}
                >
                  <span className="text-xs">{medsos.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Kolom 2 - Link Cepat */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1">
              <span>🔗</span> Link Cepat
            </h4>
            <ul className="space-y-1.5">
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="text-[10px] text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-1"
                  >
                    <span className="text-[8px]">›</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 3 - Layanan */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1">
              <span>⚡</span> Layanan
            </h4>
            <ul className="space-y-1.5">
              {layanan.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.href}
                    className="text-[10px] text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-1"
                  >
                    <span className="text-[8px]">›</span>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 4 - Kontak & Jam Operasional */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1">
              <span>📍</span> Kontak & Jam
            </h4>
            <ul className="space-y-2">
              {kontak.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[10px] text-gray-400">
                  <span className="text-xs shrink-0">{item.icon}</span>
                  <span className="leading-relaxed">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700/50 my-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-center">
          <p className="text-[8px] text-gray-500 tracking-wide">
            © {currentYear} {schoolName}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/kebijakan-privasi" className="text-[8px] text-gray-500 hover:text-gray-400 transition">
              Kebijakan Privasi
            </Link>
            <span className="text-[8px] text-gray-600">|</span>
            <Link href="/syarat-ketentuan" className="text-[8px] text-gray-500 hover:text-gray-400 transition">
              Syarat & Ketentuan
            </Link>
            <span className="text-[8px] text-gray-600">|</span>
            <Link href="/bantuan" className="text-[8px] text-gray-500 hover:text-gray-400 transition">
              Bantuan
            </Link>
          </div>
        </div>

        {/* Badge Kecil */}
        <div className="text-center mt-4">
          <p className="text-[6px] text-gray-600 uppercase tracking-[0.2em]">
            Powered by Digital Library System
          </p>
        </div>
      </div>
    </footer>
  );
}