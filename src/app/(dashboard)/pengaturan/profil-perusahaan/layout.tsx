import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil Perusahaan - Pengaturan",
  description: "Identitas instansi dan pejabat penandatangan dokumen cuti PG Trangkil",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
