import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kelola User",
  description: "Manajemen akun pengguna dan hak akses aplikasi PG Trangkil",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
