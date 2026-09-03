import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengambilan Cuti",
  description: "Formulir permohonan pengambilan cuti karyawan PG Trangkil",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
