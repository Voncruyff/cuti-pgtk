import { requireAuth } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { SidebarProvider } from "@/components/layout/sidebar-context";

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
        {/* 1. KOMPONEN SIDEBAR MANDIRI */}
        <Sidebar user={user} />

        {/* 2. AREA KONTEN KANAN DENGAN SCROLL MANDIRI */}
        <div className="flex flex-1 flex-col h-screen overflow-y-auto min-w-0">
          {/* 3. KOMPONEN HEADER MANDIRI */}
          <Header user={user} />

          {/* 4. ISI KONTEN HALAMAN */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
