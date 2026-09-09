import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getDepartmentsListAction } from "@/actions/aksi-bagian";
import { KomponenHalamanBagian } from "./komponen-halaman-bagian";
import type { ItemBagian } from "@/components/fitur/master-bagian/komponen-bagian";

export const metadata: Metadata = {
  title: "Master Bagian",
  description: "Pengelolaan data master unit kerja / bagian PG Trangkil",
};

export default async function HalamanMasterBagian() {
  await requireRole(["ADMIN_UTAMA"]);
  const res = await getDepartmentsListAction();
  return (
    <KomponenHalamanBagian
      initialData={res.success && res.data ? (res.data as ItemBagian[]) : undefined}
    />
  );
}
