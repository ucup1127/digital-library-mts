// components/admin/NotificationBell.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  timestamp: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userRole, setUserRole] = useState("");
  let counter = 0; // ✅ Counter lokal untuk memastikan unik

  // Ambil role dari localStorage
  useEffect(() => {
    const role = localStorage.getItem("user_role");
    setUserRole(role || "");
  }, []);

  // Fungsi untuk cek notifikasi baru
  const checkNotifications = async () => {
    try {
      const url = `/api/notifications?lastCheck=${lastCheck || ""}`;
      const res = await fetch(url);
      const data = await res.json();
      
      const newNotifications: Notification[] = [];
      
      // Notifikasi buku baru
      if (data.newBooks?.length > 0) {
        data.newBooks.forEach((book: any, idx: number) => {
          newNotifications.push({
            id: `book-${book.id}-${Date.now()}-${idx}-${++counter}`, // ✅ Kombinasi unik
            title: "Buku Baru",
            message: `"${book.title}" oleh ${book.author} telah ditambahkan`,
            type: "success",
            timestamp: book.createdAt
          });
        });
      }
      
      // Notifikasi user baru
      if (data.newUsers?.length > 0) {
        data.newUsers.forEach((user: any, idx: number) => {
          newNotifications.push({
            id: `user-${user.id}-${Date.now()}-${idx}-${++counter}`, // ✅ Kombinasi unik
            title: "User Baru",
            message: `${user.name || user.email} telah bergabung`,
            type: "info",
            timestamp: user.createdAt
          });
        });
      }
      
      // Notifikasi aktivitas baca
      if (data.newActivities?.length > 0) {
        data.newActivities.forEach((activity: any, idx: number) => {
          newNotifications.push({
            id: `activity-${activity.id}-${Date.now()}-${idx}-${++counter}`, // ✅ Kombinasi unik
            title: "Aktivitas Membaca",
            message: `${activity.userEmail || "Guest"} membaca "${activity.bookTitle}"`,
            type: "warning",
            timestamp: activity.createdAt
          });
        });
      }
      
      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
        setUnreadCount(prev => prev + newNotifications.length);
        
        // Tampilkan toast notifikasi untuk yang terbaru
        const latest = newNotifications[0];
        toast.custom((t) => (
          <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <span className="text-lg">🔔</span>
            <div>
              <p className="text-xs font-bold">{latest.title}</p>
              <p className="text-[10px]">{latest.message}</p>
            </div>
          </div>
        ), { duration: 4000 });
      }
      
      setLastCheck(data.timestamp);
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
  };

  // Polling setiap 10 detik
  useEffect(() => {
    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") return;
    
    //checkNotifications();
    //const interval = setInterval(checkNotifications, 10000);
    
    //return () => clearInterval(interval);
  }, [userRole]);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = () => {
    setUnreadCount(0);
    setIsOpen(false);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    setIsOpen(false);
  };

  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      
      {/* Dropdown Notifikasi - Geser ke kanan agar tidak kepotong */}
{isOpen && (
   <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50">
    <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Notifikasi</h3>
      {notifications.length > 0 && (
        <button
          onClick={clearAll}
          className="text-[10px] text-gray-400 hover:text-red-500 transition"
        >
          Bersihkan
        </button>
      )}
    </div>
    
    <div className="max-h-96 overflow-y-auto">
      {notifications.length === 0 ? (
        <div className="p-6 text-center text-gray-400 text-sm">
          <span className="text-2xl block mb-2">🔕</span>
          Belum ada notifikasi
        </div>
      ) : (
        notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer ${
              notif.type === "success" ? "border-l-4 border-l-green-500" :
              notif.type === "warning" ? "border-l-4 border-l-yellow-500" :
              "border-l-4 border-l-blue-500"
            }`}
            onClick={markAsRead}
          >
            <div className="flex items-start gap-2">
              <span className="text-sm">
                {notif.type === "success" ? "✅" : notif.type === "warning" ? "📖" : "👤"}
              </span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  {notif.title}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {notif.message}
                </p>
                <p className="text-[8px] text-gray-400 mt-1">
                  {new Date(notif.timestamp).toLocaleTimeString("id-ID")}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
    
    <div className="p-2 border-t border-gray-100 dark:border-gray-700 text-center">
      <button
        onClick={() => {
          setIsOpen(false);
          window.location.href = "/admin/laporan-aktivitas";
        }}
        className="text-[9px] text-blue-600 dark:text-blue-400 hover:underline"
      >
        Lihat semua aktivitas →
      </button>
    </div>
  </div>
)}
    </div>
  );
}