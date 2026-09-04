import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { NavigasiTabPengaturan } from "@/components/fitur/pengaturan/navigasi-tab-pengaturan";

export default async function PengaturanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman Pengaturan */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {user.role === "ADMIN_UTAMA" ? "Pengaturan Sistem" : "Pengaturan Akun"}
        </h1>
        <p className="text-xs text-slate-500">
          {user.role === "ADMIN_UTAMA"
            ? "Kelola automasi saldo, profil perusahaan, penandatanganan dokumen cuti, serta keamanan akun Anda."
            : "Kelola informasi profil, username, dan keamanan akun Anda."}
        </p>
      </div>

      {/* Navigation Tab Bar (Automasi Saldo & Profil Perusahaan disembunyikan untuk Admin Bagian) */}
      <NavigasiTabPengaturan userRole={user.role} />

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
}
