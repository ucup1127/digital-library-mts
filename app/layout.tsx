// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import CsrfProvider from "@/components/CsrfProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "MTSMUHBMS - Perpustakaan Digital",
  description: "Perpustakaan Digital MTs Muhammadiyah Patikraja",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} antialiased`}>
        <CsrfProvider />
        {children}
        <Toaster position="top-center" />
        {/* 🔥 Speed Insights — di paling bawah, setelah semua konten */}
        <SpeedInsights />
      </body>
    </html>
  );
}