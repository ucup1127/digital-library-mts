// components/ui/IdleLogout.tsx
"use client";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function IdleLogout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const handleIdle = async () => {
      // Panggil API logout — hapus session di DB & clear cookie httpOnly
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (error) {
        console.error("Idle logout error:", error);
      }

      // Bersihkan data client
      localStorage.clear();
      sessionStorage.clear();

      toast.error("⏰ Sesi berakhir karena tidak aktif selama 30 menit");

      // Redirect ke halaman login
      window.location.href = "/login/admin?logout=idle";
    };

    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(handleIdle, 30 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      clearTimeout(idleTimer);
    };
  }, []);

  return <>{children}</>;
}