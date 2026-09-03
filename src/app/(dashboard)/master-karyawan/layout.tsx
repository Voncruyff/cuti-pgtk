import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Master Karyawan",
  description: "Kelola data karyawan dan NIP PG Trangkil",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
