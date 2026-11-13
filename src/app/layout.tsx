import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Pencatatan WiFi — ISP Billing",
  description: "Aplikasi pencatatan pelanggan & penagihan bisnis internet (ISP) sederhana",
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
