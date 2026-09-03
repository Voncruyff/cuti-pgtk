import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Koreksi Cuti",
  description: "Koreksi tanggal cuti dan pembatalan cuti karyawan PG Trangkil",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
