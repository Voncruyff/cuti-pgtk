import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Karyawan Cuti Hari Ini",
  description: "Daftar resmi karyawan cuti hari ini - PT Kebon Agung PG Trangkil",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
