import { requireAuth } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { SidebarProvider } from "@/components/layout/sidebar-context";

/**
 * Layout Induk Halaman Admin:
 * Di sini Komponen Sidebar dan Header dipisahkan secara mandiri.
 *
 * Menggunakan arsitektur App-Shell (h-screen overflow-hidden):
 * - Sidebar mandiri & kokoh (100% diam, tidak terpengaruh scroll window).
 * - Area konten kanan memiliki scrollbar mandiri (h-screen overflow-y-auto).
 * - Hasil: Ikon sidebar tidak akan bergetar/goyang (zero sub-pixel jitter) saat di-scroll.
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
        {/* ========================================================= */}
        {/* 1. KOMPONEN SIDEBAR ADMIN MANDIRI (TERPISAH)              */}
        {/* ========================================================= */}
        <Sidebar user={user} />

        {/* ========================================================= */}
        {/* 2. AREA KONTEN KANAN DENGAN SCROLL MANDIRI                */}
        {/* ========================================================= */}
        <div className="flex flex-1 flex-col h-screen overflow-y-auto min-w-0">
          {/* ======================================================= */}
          {/* 3. KOMPONEN HEADER ADMIN MANDIRI (TERPISAH)             */}
          {/* ======================================================= */}
          <Header user={user} />

          {/* Konten Halaman Aktif */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
