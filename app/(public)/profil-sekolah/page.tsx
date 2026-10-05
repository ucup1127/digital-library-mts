// app/(public)/profil-sekolah/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

export default function ProfilSekolahRedirect() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [schoolWebsite, setSchoolWebsite] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();

        if (!meData.user) {
          setIsLoggedIn(false);
          return;
        }

        setIsLoggedIn(true);

        // Ambil website sekolah dari API
        const schoolRes = await fetch("/api/public/school-info");
        const schoolData = await schoolRes.json();
        const website = schoolData.website;

        if (website) {
          setSchoolWebsite(website);
          // Redirect
          setTimeout(() => {
            window.location.href = website;
          }, 500);
        } else {
          // Nggak ada website → balik ke home
          setTimeout(() => {
            window.location.href = "/";
          }, 500);
        }
      } catch (error) {
        console.error(error);
        setIsLoggedIn(false);
      }
    };

    init();
  }, []);

  // Loading
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  // Belum login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-200">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Anda Belum Login</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Harap login/register agar kami bisa menampilkan informasi sesuai sekolah Anda.
          </p>
          <div className="space-y-3">
            <Link
              href="/login/user"
              className="block w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-200"
            >
              Login Sekarang
            </Link>
            <Link
              href="/register"
              className="block w-full py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-100 transition"
            >
              Daftar Akun Baru
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Sudah login — lagi redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Mengalihkan ke profil sekolah...</p>
      </div>
    </div>
  );
}