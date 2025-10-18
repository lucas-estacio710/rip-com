import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Navigation from "@/components/layout/Navigation";
import Header from "@/components/layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "R.I.P. Pet Santos - Inteligência Comercial",
  description: "Sistema de gestão de relacionamento comercial para R.I.P. Pet Santos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e3a8a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar - Desktop only */}
          <Sidebar />

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />

            {/* Page content with padding for mobile navigation */}
            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
              <div className="container mx-auto px-4 py-6 max-w-7xl">
                {children}
              </div>
            </main>
          </div>
        </div>

        {/* Bottom Navigation - Mobile only */}
        <Navigation />
      </body>
    </html>
  );
}
