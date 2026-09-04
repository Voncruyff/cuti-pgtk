import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { KomponenHalamanUser } from "./komponen-halaman-user";

export const metadata: Metadata = {
  title: "Kelola User",
  description: "Pengelolaan data akun operator sistem cuti PG Trangkil",
};

export default async function HalamanKelolaUser() {
  await requireRole(["ADMIN_UTAMA"]);
  return <KomponenHalamanUser />;
}
