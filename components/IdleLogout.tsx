// components/ui/IdleLogout.tsx (atau di components/IdleLogout.tsx)
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function IdleLogout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        const isLoggedIn = localStorage.getItem("isLoggedIn");
        const userRole = localStorage.getItem("user_role");
        
        if (isLoggedIn === "true") {
          localStorage.clear();
          toast.error("⏰ Sesi berakhir karena tidak aktif selama 30 menit");
          
          if (userRole === "ADMIN") {
            window.location.href = "/login/admin";
          } else {
            window.location.href = "/login/user";
          }
        }
      }, 30 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      clearTimeout(idleTimer);
    };
  }, []);

  return <>{children}</>;
}