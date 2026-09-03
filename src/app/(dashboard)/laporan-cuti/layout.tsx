import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Cuti",
  description: "Rekapitulasi laporan pemakaian cuti dan cetak dokumen PG Trangkil",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
