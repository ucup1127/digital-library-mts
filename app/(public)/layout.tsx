// app/(public)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const checkMaintenance = async () => {
      const role = localStorage.getItem("user_role") || "";
      setUserRole(role);
      
      try {
        const res = await fetch("/api/settings?key=maintenance_mode");
        const data = await res.json();
        const maintenance = data.value === "true";
        setIsMaintenance(maintenance);
        
        if (maintenance && role !== "SUPER_ADMIN" && role !== "ADMIN" && !pathname.startsWith("/admin")) {
          router.push("/maintenance");
        }
      } catch (error) {
        console.error("Error checking maintenance:", error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkMaintenance();
  }, [router, pathname]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  if (isMaintenance && userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* Hapus padding top yang berlebih */}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}