// app/(public)/profil-sekolah/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilSekolahRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    const website = localStorage.getItem("school_website") || "https://mtsmuhammadiyahpatikraja.sch.id/";
    window.location.href = website;
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Mengalihkan ke profil sekolah...</p>
      </div>
    </div>
  );
}