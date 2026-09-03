import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rincian Cuti",
  description: "Rincian histori mutasi saldo dan riwayat cuti karyawan PG Trangkil",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
