import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { KomponenHalamanBagian } from "./komponen-halaman-bagian";

export const metadata: Metadata = {
  title: "Master Bagian",
  description: "Pengelolaan data master unit kerja / bagian PG Trangkil",
};

export default async function HalamanMasterBagian() {
  await requireRole(["ADMIN_UTAMA"]);
  return <KomponenHalamanBagian />;
}
