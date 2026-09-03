import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Master Stasiun",
  description: "Kelola data stasiun kerja per bagian PG Trangkil",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
