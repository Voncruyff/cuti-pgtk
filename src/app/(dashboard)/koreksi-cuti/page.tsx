import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { KomponenKoreksiCuti } from "./komponen-koreksi-cuti";

export const metadata: Metadata = {
  title: "Koreksi Cuti",
  description: "Formulir koreksi dan revisi transaksi cuti karyawan PG Trangkil",
};

export default async function HalamanKoreksiCuti() {
  await requireRole(["ADMIN_UTAMA"]);
  return <KomponenKoreksiCuti />;
}
