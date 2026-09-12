// components/ui/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [schoolName, setSchoolName] = useState("Perpustakaan Digital");
  const [schoolLogo, setSchoolLogo] = useState("");
  const [schoolWebsite, setSchoolWebsite] = useState("https://mtsmuhammadiyahpatikraja.sch.id");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const name = localStorage.getItem("user_name") || "";
    const role = localStorage.getItem("user_role") || "";
    
    // 🔥 AMBIL DATA SEKOLAH DARI LOCALSTORAGE
    let school = localStorage.getItem("school_name") || "Perpustakaan Digital";
    let logo = localStorage.getItem("school_logo") || "";
    let website = localStorage.getItem("school_website") || "https://mtsmuhammadiyahpatikraja.sch.id";
    
    // 🔥 Jika SUPER_ADMIN dan ada selected_school_name, pakai itu
    if (role === "SUPER_ADMIN") {
      const selectedName = localStorage.getItem("selected_school_name");
      const selectedLogo = localStorage.getItem("selected_school_logo") || "";
      const selectedWebsite = localStorage.getItem("selected_school_website") || "https://mtsmuhammadiyahpatikraja.sch.id";
      
      if (selectedName) {
        school = selectedName;
        logo = selectedLogo;
        website = selectedWebsite;
      }
    }
    
    setIsLoggedIn(loggedIn);
    setUserName(name);
    setUserRole(role);
    setSchoolName(school);
    setSchoolLogo(logo);
    setSchoolWebsite(website);
  }, []);

  // 🔥 DENGARKAN EVENT schoolChanged (untuk SUPER_ADMIN)
  useEffect(() => {
    const handleSchoolChange = (event: any) => {
      const newSchoolName = event.detail?.schoolName;
      const newSchoolLogo = event.detail?.schoolLogo || "";
      const newSchoolWebsite = event.detail?.schoolWebsite || "https://mtsmuhammadiyahpatikraja.sch.id";
      
      if (newSchoolName) {
        console.log("🏫 School changed to:", newSchoolName);
        setSchoolName(newSchoolName);
        setSchoolLogo(newSchoolLogo);
        setSchoolWebsite(newSchoolWebsite);
      }
    };
    
    window.addEventListener("schoolChanged", handleSchoolChange);
    return () => window.removeEventListener("schoolChanged", handleSchoolChange);
  }, []);

  const openLogoutConfirm = () => {
    setShowLogoutModal(true);
    setMobileMenuOpen(false);  // tutup mobile menu kalau lagi kebuka
  };

  const confirmLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }

    localStorage.clear();
    sessionStorage.clear();

    setIsLoggedIn(false);
    setShowLogoutModal(false);

    if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
      window.location.href = "/login/admin?logout=success";
    } else {
      window.location.href = "/login/user?logout=success";
    }
  };

  const navLinks = [
    { href: "/", label: "Beranda" },
    { href: "/tentang", label: "Tentang" },
    { href: "/galeri", label: "Galeri" },
    { href: schoolWebsite, label: "Profil Sekolah", external: true },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === href;
    return pathname?.startsWith(href);
  };

  const getSchoolInitial = () => {
    if (!schoolName || schoolName === "Perpustakaan Digital") return "📚";
    return schoolName.charAt(0).toUpperCase();
  };

  const getShortSchoolName = () => {
    if (!schoolName || schoolName === "Perpustakaan Digital") return "Perpus Digital";
    if (schoolName.length > 20) return schoolName.slice(0, 18) + "...";
    return schoolName;
  };

  const getInitials = () => {
    if (!userName) return "U";
    const parts = userName.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="px-3 sm:px-4">
          <div className="flex justify-between items-center h-12 sm:h-14">
            {/* 🔥 LOGO DAN NAMA SEKOLAH - DINAMIS */}
            <Link href="/" className="flex items-center gap-2 shrink-0 min-w-0">
              {schoolLogo ? (
                <img 
                  src={schoolLogo} 
                  alt={schoolName} 
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover bg-gray-100"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm sm:text-base shadow-md">
                  {getSchoolInitial()}
                </div>
              )}
              
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-gray-800 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-[200px]">
                  {getShortSchoolName()}
                </span>
                <span className="text-[7px] text-gray-400 hidden sm:block">Perpustakaan Digital</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs font-medium transition flex items-center gap-0.5 ${
                      isActive(link.href)
                        ? "text-blue-600 border-b-2 border-blue-600 pb-0.5"
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    {link.label}
                    <span className="text-[8px]">↗</span>
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-xs font-medium transition ${
                      isActive(link.href)
                        ? "text-blue-600 border-b-2 border-blue-600 pb-0.5"
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </div>

            {/* Right Side - User Menu */}
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {getInitials()}
                    </div>
                    <span className="text-xs text-gray-700 max-w-[100px] truncate hidden sm:block">{userName}</span>
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link href="/akun" className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition">👤 Akun Saya</Link>
                    {(userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
                      <Link href="/admin" className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition">⚙️ Admin Panel</Link>
                    )}
                    <button onClick={openLogoutConfirm} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition border-t border-gray-100">
                      🚪 Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login/user"
                  className="px-4 py-1 bg-blue-600 text-white rounded-full text-[10px] font-semibold hover:bg-blue-700 transition shadow-sm"
                >
                  Masuk
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition -mr-1"
              >
                <div className="w-5 h-4 flex flex-col justify-between">
                  <span className={`w-5 h-0.5 bg-gray-600 rounded-full transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
                  <span className={`w-5 h-0.5 bg-gray-600 rounded-full transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`} />
                  <span className={`w-5 h-0.5 bg-gray-600 rounded-full transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <div 
        className={`fixed top-12 left-0 right-0 bg-white border-b border-gray-100 shadow-lg z-40 transition-all duration-300 md:hidden ${
          mobileMenuOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-4"
        }`}
      >
        <div className="p-3 space-y-1">
          {navLinks.map((link) => (
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-between"
              >
                {link.label}
                <span className="text-[10px] text-gray-400">↗</span>
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive(link.href)
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            )
          ))}
          
          <div className="border-t border-gray-100 my-2"></div>
          
          {isLoggedIn ? (
            <>
              <Link
                href="/akun"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                👤 Akun Saya
              </Link>
              {(userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  ⚙️ Admin Panel
                </Link>
              )}
              <button
                onClick={openLogoutConfirm}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50"
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <Link
              href="/login/user"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm text-center text-white bg-blue-600"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>

      {/* Spacer agar konten tidak tertutup navbar */}
      <div className="h-12 sm:h-14"></div>
      {/* Modal Konfirmasi Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚪</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Konfirmasi Keluar</h3>
              <p className="text-sm text-gray-500 mt-2">
                Apakah Anda yakin ingin keluar dari sistem?
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition"
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}