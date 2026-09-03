"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/": "Karyawan Cuti Hari Ini | Cuti PG Trangkil",
  "/landingpage": "Karyawan Cuti Hari Ini | Cuti PG Trangkil",
  "/dashboard": "Dashboard | Cuti PG Trangkil",
  "/master-karyawan": "Master Karyawan | Cuti PG Trangkil",
  "/master-bagian": "Master Bagian | Cuti PG Trangkil",
  "/master-stasiun": "Master Stasiun | Cuti PG Trangkil",
  "/ambil-cuti": "Pengambilan Cuti | Cuti PG Trangkil",
  "/tambah-saldo-cuti": "Tambah Saldo Cuti | Cuti PG Trangkil",
  "/rincian-cuti": "Rincian Cuti | Cuti PG Trangkil",
  "/laporan-cuti": "Laporan Cuti | Cuti PG Trangkil",
  "/kelola-user": "Kelola User | Cuti PG Trangkil",
  "/pengaturan": "Automasi Saldo | Cuti PG Trangkil",
  "/pengaturan/automasi-saldo": "Automasi Saldo | Cuti PG Trangkil",
  "/pengaturan/profil-perusahaan": "Profil Perusahaan | Cuti PG Trangkil",
  "/pengaturan/keamanan-akun": "Keamanan Akun | Cuti PG Trangkil",
  "/login": "Login | Cuti PG Trangkil",
};

export function PenyesuaiJudulHalaman() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // Cek exact match
    if (TITLES[pathname]) {
      document.title = TITLES[pathname];
      return;
    }

    // Fallback format jika path dinamis
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      const formatted = lastSegment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      document.title = `${formatted} | Cuti PG Trangkil`;
    }
  }, [pathname]);

  return null;
}
