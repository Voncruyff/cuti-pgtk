import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Master Bagian",
  description: "Kelola data bagian kerja dan departemen PG Trangkil",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
