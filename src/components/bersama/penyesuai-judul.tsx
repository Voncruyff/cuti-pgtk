"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const APP_SUFFIX = process.env.NEXT_PUBLIC_APP_NAME || "CUTI PGTK";

const PAGE_NAMES: Record<string, string> = {
  "/": "Karyawan Cuti Hari Ini",
  "/landingpage": "Karyawan Cuti Hari Ini",
  "/dashboard": "Dashboard",
  "/master-karyawan": "Master Karyawan",
  "/master-bagian": "Master Bagian",
  "/master-stasiun": "Master Stasiun",
  "/ambil-cuti": "Pengambilan Cuti",
  "/tambah-saldo-cuti": "Tambah Saldo Cuti",
  "/koreksi-cuti": "Koreksi Cuti",
  "/rincian-cuti": "Rincian Cuti",
  "/laporan-cuti": "Laporan Cuti",
  "/kelola-user": "Kelola User",
  "/pengaturan": "Automasi Saldo",
  "/pengaturan/automasi-saldo": "Automasi Saldo",
  "/pengaturan/profil-perusahaan": "Profil Perusahaan",
  "/pengaturan/keamanan-akun": "Keamanan Akun",
  "/login": "Login",
};

export function PenyesuaiJudulHalaman() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // Cek exact match
    if (PAGE_NAMES[pathname]) {
      document.title = `${PAGE_NAMES[pathname]} | ${APP_SUFFIX}`;
      return;
    }

    // Fallback format jika path dinamis
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      const formatted = lastSegment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      document.title = `${formatted} | ${APP_SUFFIX}`;
    }
  }, [pathname]);

  return null;
}
