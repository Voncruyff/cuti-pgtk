import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Masuk ke Sistem Pengelolaan Cuti PG Trangkil",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
