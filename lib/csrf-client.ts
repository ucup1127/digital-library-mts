// lib/csrf-client.ts
"use client";

/**
 * 🔥 Ambil CSRF token dari cookie
 */
export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === "csrf_token") {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * 🔥 Fetch wrapper yang otomatis kirim CSRF token
 *
 * Contoh:
 * const res = await csrfFetch("/api/buku", {
 *   method: "POST",
 *   body: JSON.stringify(data),
 * });
 */
export async function csrfFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();

  // Cuma POST/PUT/PATCH/DELETE yang butuh CSRF
  const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  const headers = new Headers(options.headers || {});

  if (needsCsrf) {
    const token = getCsrfToken();
    if (token) {
      headers.set("X-CSRF-Token", token);
    }
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // kirim cookie
  });
}