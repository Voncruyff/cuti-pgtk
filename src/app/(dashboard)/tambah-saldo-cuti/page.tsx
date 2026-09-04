import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { KomponenTambahSaldo } from "./komponen-tambah-saldo";

export const metadata: Metadata = {
  title: "Tambah Saldo Cuti",
  description: "Formulir penambahan saldo hak cuti karyawan PG Trangkil",
};

export default async function HalamanTambahSaldoCuti() {
  await requireRole(["ADMIN_UTAMA"]);
  return <KomponenTambahSaldo />;
}
