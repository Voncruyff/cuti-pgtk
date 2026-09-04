import { requireAuth } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function PengaturanRootPage() {
  const user = await requireAuth();
  if (user.role === "ADMIN_UTAMA") {
    redirect("/pengaturan/automasi-saldo");
  } else {
    redirect("/pengaturan/keamanan-akun");
  }
}
