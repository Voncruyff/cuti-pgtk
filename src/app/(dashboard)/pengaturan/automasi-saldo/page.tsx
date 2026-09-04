import { requireRole } from "@/lib/auth/session";
import { KomponenAutomasiSaldo } from "@/components/fitur/pengaturan/komponen-automasi-saldo";

export default async function PengaturanAutomasiSaldoPage() {
  await requireRole(["ADMIN_UTAMA"]);
  return <KomponenAutomasiSaldo />;
}
