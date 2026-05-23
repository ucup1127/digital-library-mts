"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// import NotificationBell from "@/components/admin/NotificationBell"; // HAPUS - tidak dipakai lagi

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initials, setInitials] = useState("");
  const [schoolLogo, setSchoolLogo] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const savedName = localStorage.getItem("user_name");
    const logo = localStorage.getItem("school_logo") || "";
    const name = localStorage.getItem("school_name") || "";
    const role = localStorage.getItem("user_role") || "";
    
    setIsLoggedIn(loggedIn);
    setSchoolLogo(logo);
    setSchoolName(name);
    setUserRole(role);

    if (savedName) {
      const nameParts = savedName.split(" ");
      const nameInitials = nameParts
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
      setInitials(nameInitials);
    }
  }, []);

  return (
    <nav className="flex justify-between items-center py-3 px-6 bg-white border-b border-gray-100 fixed top-0 w-full z-50 shadow-sm dark:bg-gray-900 dark:border-gray-700">
      <Link href="/" className="flex items-center gap-3">
        {/* Logo */}
        {isLoggedIn && schoolLogo ? (
          <img 
            src={schoolLogo} 
            alt={schoolName}
            className="h-10 w-auto object-contain rounded-lg"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-lg font-bold shadow-md">
            📚
          </div>
        )}
        
        {/* Nama Sekolah */}
        <div className="flex flex-col">
          {isLoggedIn && schoolName ? (
            <>
              <h1 className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight tracking-tight">
                {schoolName}
              </h1>
              <p className="text-[7px] text-gray-400 -mt-0.5 tracking-wider">
                Perpustakaan Digital
              </p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-black italic tracking-tighter">
                <span className="text-blue-600">MUHPATH</span>
                <span className="text-gray-800 dark:text-gray-200">LIB</span>
              </h1>
              <p className="text-[8px] text-gray-400 -mt-0.5 tracking-wider">
                Perpustakaan Digital
              </p>
            </>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-4">
        
        {/* NOTIFIKASI BELL SUDAH DIHAPUS */}
        
        {isLoggedIn ? (
          <Link href="/akun" className="group flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-all">
              <span className="text-[10px] font-bold text-white uppercase">
                {initials || "U"}
              </span>
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 hidden sm:inline">
              Akun
            </span>
          </Link>
        ) : (
          <Link href="/login/user" className="px-5 py-2 bg-gray-800 text-white rounded-full font-bold text-[9px] uppercase tracking-wider hover:bg-blue-600 transition">
            Masuk →
          </Link>
        )}
      </div>
    </nav>
  );
}