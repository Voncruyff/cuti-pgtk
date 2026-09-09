import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getStationsListAction, getDepartmentsSelectorAction } from "@/actions/aksi-stasiun";
import { KomponenHalamanStasiun } from "./komponen-halaman-stasiun";

export const metadata: Metadata = {
  title: "Master Stasiun",
  description: "Pengelolaan data master stasiun kerja PG Trangkil",
};

export default async function HalamanMasterStasiun() {
  await requireRole(["ADMIN_UTAMA"]);
  const [stasiunRes, bagianRes] = await Promise.all([
    getStationsListAction(),
    getDepartmentsSelectorAction(),
  ]);

  return (
    <KomponenHalamanStasiun
      initialStations={stasiunRes.success && stasiunRes.data ? stasiunRes.data : undefined}
      initialDepartments={bagianRes.success && bagianRes.data ? bagianRes.data : undefined}
    />
  );
}
