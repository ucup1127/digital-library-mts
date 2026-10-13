// components/CsrfProvider.tsx
"use client";

import { useEffect } from "react";
import { getCsrfToken } from "@/lib/csrf-client";

export default function CsrfProvider() {
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async function (input, init) {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.toString()
          : input.url;

      const method = (init?.method || "GET").toUpperCase();

      // 🔥 Cek same-origin — skip URL external (vercel.com, dll)
      const isSameOrigin =
        url.startsWith("/") ||
        url.startsWith(window.location.origin);

      // Attach CSRF hanya untuk request mutating ke /api/ SAME ORIGIN
      if (
        isSameOrigin &&
        ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
        url.includes("/api/") &&
        !url.includes("/api/auth/login") &&
        !url.includes("/api/register") &&
        !url.includes("/api/auth/logout")
      ) {
        const token = getCsrfToken();
        if (token) {
          init = init || {};

          const isFormData = init.body instanceof FormData;

          const headers = new Headers(init.headers || {});
          headers.set("X-CSRF-Token", token);

          // FormData: hapus Content-Type biar browser auto-set boundary
          if (isFormData) {
            headers.delete("Content-Type");
          }

          init.headers = headers;
        }
      }

      return originalFetch.call(this, input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}