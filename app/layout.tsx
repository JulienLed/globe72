import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppHeader } from "@/components/AppHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Globe 72 — Besoins mobilier",
  description: "Outil de collecte de besoins mobilier — ABC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Video background — fixed full-viewport, z-index:-1. Mobile fallback: #f0f4f8 bg-color. */}
        <div style={{ position: "fixed", inset: 0, zIndex: -1, backgroundColor: "#f0f4f8" }}>
          <video
            autoPlay
            muted
            loop
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          >
            <source src="/wallpaper.webm" type="video/webm" />
          </video>
        </div>
        <AppHeader />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
