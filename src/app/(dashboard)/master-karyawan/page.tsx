import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/session";
import { KomponenMasterKaryawan } from "./komponen-master-karyawan";

export const metadata: Metadata = {
  title: "Master Karyawan",
  description: "Pengelolaan data master karyawan PG Trangkil",
};

export default async function HalamanMasterKaryawan() {
  const user = await requireAuth();
  return <KomponenMasterKaryawan user={user} />;
}
