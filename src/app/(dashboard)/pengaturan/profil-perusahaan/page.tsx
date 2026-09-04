import { requireRole } from "@/lib/auth/session";
import { KomponenProfilPerusahaan } from "@/components/fitur/pengaturan/komponen-profil-perusahaan";

export default async function PengaturanProfilPerusahaanPage() {
  await requireRole(["ADMIN_UTAMA"]);
  return <KomponenProfilPerusahaan />;
}
