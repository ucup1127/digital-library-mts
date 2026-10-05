// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import CsrfProvider from "@/components/CsrfProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MUHAPATI - Perpustakaan Digital",
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
      </body>
    </html>
  );
}