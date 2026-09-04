import { requireRole } from "@/lib/auth/session";
import { KomponenPenandatangan } from "@/components/fitur/pengaturan/komponen-penandatangan";

export default async function PengaturanPenandatanganPage() {
  await requireRole(["ADMIN_UTAMA"]);
  return <KomponenPenandatangan />;
}
