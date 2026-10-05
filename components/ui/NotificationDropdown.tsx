// components/ui/NotificationDropdown.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Inbox,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationDropdown() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Polling setiap 60 detik
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Klik di luar → tutup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClickNotif = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await fetch(`/api/notifications/${notif.id}/read`, { method: "PUT" });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (error) {
        console.error(error);
      }
    }

    if (notif.link) {
      router.push(notif.link);
      setOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "DUE_TODAY":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "OVERDUE":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "EXTEND_PENDING":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "EXTEND_APPROVED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "EXTEND_REJECTED":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Baru saja";
    if (mins < 60) return `${mins} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString("id-ID");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-md">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              Notifikasi
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50"
              >
                <Check className="w-3 h-3" />
                Tandai semua
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Tidak ada notifikasi</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClickNotif(notif)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${
                    !notif.isRead ? "bg-blue-50/40" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        notif.type === "OVERDUE" || notif.type === "EXTEND_REJECTED"
                          ? "bg-red-100"
                          : notif.type === "EXTEND_APPROVED"
                          ? "bg-green-100"
                          : "bg-blue-100"
                      }`}
                    >
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-xs ${
                            !notif.isRead ? "font-bold text-gray-800" : "font-medium text-gray-700"
                          }`}
                        >
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[9px] text-gray-400 mt-1">
                        {formatTime(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}