// components/ui/Footer.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Footer() {
  const [schoolName, setSchoolName] = useState("Perpustakaan Digital");
  const [schoolLogo, setSchoolLogo] = useState("");
  const [schoolWebsite, setSchoolWebsite] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [schoolPhone, setSchoolPhone] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      // Cek login dulu
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();

        if (!meData.user) {
          setIsLoggedIn(false);
          setSchoolName("Perpustakaan Digital");
          return;
        }

        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
        return;
      }

      // Kalau login — ambil data sekolah
      try {
        const schoolRes = await fetch("/api/public/school-info");
        const schoolData = await schoolRes.json();
        setSchoolName(schoolData.name || "Perpustakaan Digital");
        setSchoolLogo(schoolData.logo || "");
        setSchoolWebsite(schoolData.website || "");

        // Coba ambil dari localStorage (detail sekolah yang dipilih)
        const addr = localStorage.getItem("school_address") || "";
        const phone = localStorage.getItem("school_phone") || "";
        const email = localStorage.getItem("school_email") || "";
        setSchoolAddress(addr);
        setSchoolPhone(phone);
        setSchoolEmail(email);
      } catch (error) {
        console.error("Error fetching school:", error);
      }
    };

    fetchData();
  }, []);

  const quickLinks = [
    { name: "Beranda", href: "/" },
    { name: "Tentang", href: "/tentang" },
    { name: "Galeri", href: "/galeri" },
    { name: "Profil Sekolah", href: "/profil-sekolah" },
  ];

  const layanan = [
    { name: "Koleksi Buku Digital", href: "/" },
    { name: "Peminjaman Buku Fisik", href: "/akun" },
    { name: "Riwayat Bacaan", href: "/akun" },
    { name: "Pusat Bantuan", href: "/bantuan" },
  ];

  const kontak = isLoggedIn
    ? [
        { icon: "📍", text: schoolAddress || "Alamat sekolah belum diatur" },
        { icon: "📞", text: schoolPhone || "Telepon belum diatur" },
        { icon: "✉️", text: schoolEmail || "Email belum diatur" },
      ]
    : [
        { icon: "📚", text: "Login untuk melihat informasi sekolah Anda" },
        { icon: "🔒", text: "Data sekolah ditampilkan setelah login" },
      ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Kolom 1 — Logo & Deskripsi */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {isLoggedIn && schoolLogo ? (
                <img
                  src={schoolLogo}
                  alt={schoolName}
                  className="w-9 h-9 rounded-xl object-cover bg-gray-100"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">📚</span>
                </div>
              )}
              <div>
                <h3 className="font-bold text-white text-sm">{schoolName}</h3>
                {isLoggedIn && schoolName !== "Perpustakaan Digital" && (
                  <p className="text-[9px] text-gray-400">Perpustakaan Digital</p>
                )}
              </div>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              {isLoggedIn
                ? "Perpustakaan digital yang menyediakan akses mudah ke ribuan koleksi buku, jurnal, dan sumber belajar lainnya untuk mendukung kegiatan belajar mengajar."
                : "Perpustakaan digital untuk mendukung kegiatan belajar mengajar. Login untuk mengakses koleksi lengkap."}
            </p>
            <div className="flex gap-2 pt-2">
              <a
                href="#"
                className="w-7 h-7 rounded-full bg-gray-700/50 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all duration-300"
                aria-label="Facebook"
              >
                <span className="text-xs">📘</span>
              </a>
              <a
                href="#"
                className="w-7 h-7 rounded-full bg-gray-700/50 flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition-all duration-300"
                aria-label="Instagram"
              >
                <span className="text-xs">📷</span>
              </a>
              <a
                href="#"
                className="w-7 h-7 rounded-full bg-gray-700/50 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all duration-300"
                aria-label="YouTube"
              >
                <span className="text-xs">▶️</span>
              </a>
            </div>
          </div>

          {/* Kolom 2 — Link Cepat */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1">
              Link Cepat
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

          {/* Kolom 3 — Layanan */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1">
              Layanan
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

          {/* Kolom 4 — Kontak */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1">
             Kontak
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
          <p className="text-[9px] text-gray-500 tracking-wide">
            © {currentYear} <span className="text-gray-400 font-medium">Luthfi Yusuf</span>. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/kebijakan-privasi" className="text-[9px] text-gray-500 hover:text-gray-300 transition">
              Kebijakan Privasi
            </Link>
            <span className="text-[9px] text-gray-700">•</span>
            <Link href="/syarat-ketentuan" className="text-[9px] text-gray-500 hover:text-gray-300 transition">
              Syarat & Ketentuan
            </Link>
            <span className="text-[9px] text-gray-700">•</span>
            <Link href="/bantuan" className="text-[9px] text-gray-500 hover:text-gray-300 transition">
              Bantuan
            </Link>
          </div>
        </div>

        {/* Badge Kecil */}
        <div className="text-center mt-4">
          <p className="text-[7px] text-gray-600 uppercase tracking-[0.2em]">
            Powered by Digital Library System
          </p>
        </div>
      </div>
    </footer>
  );
}