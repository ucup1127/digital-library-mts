// app/maintenance/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function MaintenancePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    setIsAdmin(role === "SUPER_ADMIN" || role === "ADMIN");
  }, []);

  const handleGoToDashboard = () => {
    setRedirecting(true);
    // Paksa redirect dengan timeout
    setTimeout(() => {
      window.location.href = "/admin";
    }, 100);
  };

  if (redirecting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4">Mengalihkan ke dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        {/* Icon */}
        <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">🔧</span>
        </div>
        
        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-2">
          Sedang Maintenance
        </h1>
        
        {/* Description */}
        <p className="text-gray-400 mb-6 max-w-md">
          Website perpustakaan sedang dalam perbaikan dan peningkatan sistem.
          Silakan coba lagi beberapa saat.
        </p>
        
        {/* Estimated time */}
        <div className="inline-block bg-gray-800 rounded-full px-4 py-2 mb-8">
          <span className="text-sm text-gray-300">
            ⏰ Estimasi selesai: 30 menit
          </span>
        </div>
        
        {/* Tombol untuk admin */}
        {isAdmin && (
          <button
            onClick={handleGoToDashboard}
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition cursor-pointer"
          >
            Masuk ke Dashboard Admin →
          </button>
        )}
        
        {/* Contact */}
        <div className="mt-8">
          <p className="text-xs text-gray-500">
            Ada pertanyaan? Hubungi admin di <br />
            <a href="mailto:admin@muhpath.sch.id" className="text-blue-400 hover:underline">
              admin@muhpath.sch.id
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}