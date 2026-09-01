import { requireAuth } from "@/lib/auth/session";
import { Sidebar } from "@/components/tata-letak/sidebar";
import { Header } from "@/components/tata-letak/header";
import { SidebarProvider } from "@/components/tata-letak/konteks-sidebar";

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
      <div className="flex h-screen overflow-hidden bg-slate-50">
        {/* 1. SIDEBAR FULL-HEIGHT DI SISI KIRI */}
        <Sidebar user={user} />

        {/* 2. AREA KONTEN KANAN DENGAN HEADER DI ATASNYA */}
        <div className="flex flex-1 flex-col h-screen overflow-y-scroll min-w-0">
          {/* HEADER MANDIRI DI ATAS KONTEN */}
          <Header user={user} />

          {/* ISI KONTEN HALAMAN (Standar Global Konsisten) */}
          <main className="flex-1 p-4 md:p-6 lg:p-7 max-w-6xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
