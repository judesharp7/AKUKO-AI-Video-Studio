import type { Metadata } from "next";
import { Inter, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "AKUKO AI Video Studio — Idea to Long-Form Video",
  description:
    "Create 30+ minute AI-directed videos from story ideas with locked character consistency, voice, music, subtitles, and multi-track timeline editing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} ${jetbrains.variable} dark`}>
      <body className="min-h-screen bg-[#0B0B10] text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

