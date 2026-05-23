// components/ui/Footer.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Footer() {
  const [schoolName, setSchoolName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const name = localStorage.getItem("school_name") || "";
    
    setIsLoggedIn(loggedIn);
    setSchoolName(name);
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Judul Footer - dinamis sesuai sekolah */}
        <div className="text-center mb-6">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-300">
            {isLoggedIn && schoolName ? schoolName : "MUHPATHLIB"}
          </h3>
          <div className="w-12 h-0.5 bg-blue-600 mx-auto mt-2 rounded-full" />
        </div>

        {/* 2 Kolom: Layanan & Kontak */}
        <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
          
          {/* Layanan */}
          <div className="text-center">
            <h4 className="font-bold text-[9px] uppercase tracking-wider text-gray-500 mb-3">
              LAYANAN
            </h4>
            <ul className="space-y-1.5">
              <li className="text-gray-400 text-[10px]">📖 Baca Online</li>
              <li className="text-gray-400 text-[10px]">📥 Download PDF</li>
              <li className="text-gray-400 text-[10px]">📚 Riwayat Baca</li>
              <li className="text-gray-400 text-[10px]">⭐ Rekomendasi</li>
            </ul>
          </div>

          {/* Kontak */}
          <div className="text-center">
            <h4 className="font-bold text-[9px] uppercase tracking-wider text-gray-500 mb-3">
              KONTAK
            </h4>
            <ul className="space-y-1.5">
              <li className="text-gray-400 text-[10px]">📧 perpus@sch.id</li>
              <li className="text-gray-400 text-[10px]">📱 (0281) 123456</li>
              <li className="text-gray-400 text-[10px]">📍 Jl. Pendidikan No. 123</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-4 text-center">
          <p className="text-gray-500 text-[7px] uppercase tracking-wider">
            © {currentYear} {isLoggedIn && schoolName ? schoolName : "MUHPATHLIB"} • Perpustakaan Digital
          </p>
        </div>
      </div>
    </footer>
  );
}