"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initials, setInitials] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const authStatus = localStorage.getItem("isLoggedIn");
    const savedName = localStorage.getItem("user_name");

    setIsLoggedIn(!!authStatus);

    if (savedName) {
      // Ambil huruf pertama dari setiap kata (maksimal 2 huruf)
      const nameParts = savedName.split(" ");
      const nameInitials = nameParts
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
      
      setInitials(nameInitials);
    }
  }, [pathname]);

  return (
    <nav className="flex justify-between items-center py-4 px-6 bg-white border-b border-gray-50 fixed top-0 w-full z-50">
      <Link href="/" className="text-xl font-black italic uppercase tracking-tighter text-blue-600">
        MUHPATH<span className="text-gray-900">LIB.</span>
      </Link>

      <div className="flex items-center gap-4">
        {isLoggedIn ? (
          <Link href="/akun" className="group">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-100 group-hover:scale-110 transition-all">
              <span className="text-[10px] font-black text-white italic uppercase">
                {/* SEKARANG INI DINAMIS */}
                {initials || "U"}
              </span>
            </div>
          </Link>
        ) : (
          <Link href="/login/user" className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-black text-[9px]">
            Masuk →
          </Link>
        )}
      </div>
    </nav>
  );
}