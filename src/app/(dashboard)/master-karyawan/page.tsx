import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/session";
import { getEmployeePageDataAction } from "@/actions/aksi-karyawan";
import { KomponenMasterKaryawan } from "./komponen-master-karyawan";

export const metadata: Metadata = {
  title: "Master Karyawan",
  description: "Pengelolaan data master karyawan PG Trangkil",
};

export default async function HalamanMasterKaryawan() {
  const [user, pageData] = await Promise.all([
    requireAuth(),
    getEmployeePageDataAction(),
  ]);

  return (
    <KomponenMasterKaryawan
      user={user}
      initialData={pageData.success ? pageData : undefined}
    />
  );
}
