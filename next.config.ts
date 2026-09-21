import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  compress: true,
  // 🔥 Whitelist host untuk dev (ngrok, cloudflare tunnel, dll)
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.io",
    "*.trycloudflare.com",
  ],

  // ============================================
  // 🔥 SECURITY HEADERS
  // ============================================
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // 🔥 Cegah clickjacking — halaman nggak bisa di-iframe
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // 🔥 Cegah MIME sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // 🔥 XSS protection (browser lama)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // 🔥 Referrer policy — kontrol info yang dikirim ke situs lain
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // 🔥 HSTS — paksa HTTPS (aktif kalau production)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // 🔥 Permissions policy — disable fitur yang nggak perlu
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;