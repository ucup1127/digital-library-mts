// app/(admin)/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    const checkAuthAndMaintenance = async () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      const userRole = localStorage.getItem("user_role");
      
      // Cek maintenance mode
      try {
        const res = await fetch("/api/settings?key=maintenance_mode");
        const data = await res.json();
        setIsMaintenance(data.value === "true");
      } catch (error) {
        console.error("Error checking maintenance:", error);
      }
      
      // Cek auth
      if (isLoggedIn === "true" && (userRole === "ADMIN" || userRole === "SUPER_ADMIN")) {
        setIsAuthenticated(true);
      } else {
        router.push("/login/admin");
      }
      
      setIsChecking(false);
    };
    
    checkAuthAndMaintenance();
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster position="top-center" />
      <Sidebar />
      <main className="flex-1 ml-64 p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
}