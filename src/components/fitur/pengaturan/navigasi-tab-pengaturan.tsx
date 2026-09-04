"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Building2, UserCheck, ShieldCheck } from "lucide-react";

interface TabItem {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
  description: string;
  roles: string[];
}

const ALL_TABS: TabItem[] = [
  {
    id: "automasi-saldo",
    name: "Automasi Saldo",
    href: "/pengaturan/automasi-saldo",
    icon: CalendarDays,
    description: "Aturan penambahan hak cuti tahunan & besar",
    roles: ["ADMIN_UTAMA"],
  },
  {
    id: "profil-perusahaan",
    name: "Profil Perusahaan",
    href: "/pengaturan/profil-perusahaan",
    icon: Building2,
    description: "Identitas instansi & alamat pabrik gula",
    roles: ["ADMIN_UTAMA"],
  },
  {
    id: "penandatangan",
    name: "Penandatanganan",
    href: "/pengaturan/penandatangan",
    icon: UserCheck,
    description: "Pejabat penandatangan formulir & laporan cuti",
    roles: ["ADMIN_UTAMA"],
  },
  {
    id: "keamanan-akun",
    name: "Keamanan Akun",
    href: "/pengaturan/keamanan-akun",
    icon: ShieldCheck,
    description: "Kredensial login & ubah kata sandi",
    roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
  },
];

interface NavigasiTabPengaturanProps {
  userRole: string;
}

export function NavigasiTabPengaturan({ userRole }: NavigasiTabPengaturanProps) {
  const pathname = usePathname();

  const visibleTabs = ALL_TABS.filter((tab) => tab.roles.includes(userRole));

  return (
    <div className="bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 flex flex-wrap gap-1">
      {visibleTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          pathname === tab.href ||
          (tab.href === "/pengaturan/automasi-saldo" && pathname === "/pengaturan");

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex-1 min-w-[170px] flex items-center justify-center sm:justify-start gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-[color,background-color,border-color,box-shadow] duration-150 ease-out cursor-pointer select-none ${
              isActive
                ? "bg-white text-[#0789D1] shadow-2xs font-bold border border-[#E8F5FC]"
                : "text-[#6B7280] hover:text-[#263238] hover:bg-white/60"
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 transition-colors ${
                isActive ? "text-[#0084c7]" : "text-slate-400"
              }`}
            />
            <span className="truncate">{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
