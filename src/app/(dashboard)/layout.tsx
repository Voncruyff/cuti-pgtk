import { requireAuth } from "@/lib/auth/session";
import { Sidebar } from "@/components/tata-letak/sidebar";
import { Header } from "@/components/tata-letak/header";
import { SidebarProvider } from "@/components/tata-letak/konteks-sidebar";
import { PageTransition } from "@/components/motion/page-transition";

/**
 * Layout Induk Halaman Dashboard:
 * Menggunakan arsitektur App-Shell (h-screen overflow-hidden):
 * - Sidebar mandiri & kokoh (100% diam, tidak terpengaruh scroll).
 * - Header mandiri di atas area konten (dinamis mengikuti halaman aktif).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-[#F3F6F8] text-[#263238] font-sans relative selection:bg-[#0789D1]/20 selection:text-[#005B96]">
        {/* Subtle Non-Neon Ambient Glow Blobs */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 bg-[#0789D1]/5 rounded-full blur-3xl pointer-events-none -z-10"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] bg-[#005B96]/5 rounded-full blur-3xl pointer-events-none -z-10"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-10 left-1/3 w-80 h-80 bg-[#E8F5FC]/60 rounded-full blur-3xl pointer-events-none -z-10"
          aria-hidden="true"
        />

        {/* 1. SIDEBAR FULL-HEIGHT DI SISI KIRI */}
        <Sidebar user={user} />

        {/* 2. AREA KONTEN KANAN DENGAN HEADER DI ATASNYA */}
        <div className="flex flex-1 flex-col h-screen overflow-y-scroll min-w-0">
          {/* HEADER MANDIRI DI ATAS KONTEN */}
          <Header user={user} />

          {/* ISI KONTEN HALAMAN (Standar Global Konsisten) */}
          <main className="flex-1 p-4 md:p-6 lg:p-7 max-w-6xl w-full mx-auto">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
