import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { KomponenHalamanStasiun } from "./komponen-halaman-stasiun";

export const metadata: Metadata = {
  title: "Master Stasiun",
  description: "Pengelolaan data master stasiun kerja PG Trangkil",
};

export default async function HalamanMasterStasiun() {
  await requireRole(["ADMIN_UTAMA"]);
  return <KomponenHalamanStasiun />;
}
