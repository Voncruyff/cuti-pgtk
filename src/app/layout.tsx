import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { IndikatorLoadingHalaman } from "@/components/bersama/indikator-loading-halaman";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Sistem Cuti Karyawan Pimpinan & Pelaksana - PG Trangkil",
  description: "Aplikasi internal pengelolaan cuti karyawan PG Trangkil Pati",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakarta.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if(typeof window!=='undefined'&&'serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(regs){for(var r of regs){r.unregister();}});}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-[#0084c7] selection:text-white">
        <Suspense fallback={null}>
          <IndikatorLoadingHalaman />
        </Suspense>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
