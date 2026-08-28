import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user || !user.isActive) {
    redirect("/login");
  }
  redirect("/dashboard");
}
