"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Building2,
  ShieldCheck,
} from "lucide-react";

interface TabItem {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

const TABS: TabItem[] = [
  {
    id: "kebijakan",
    name: "Ketentuan Saldo Otomatis",
    href: "/pengaturan/kebijakan",
    icon: CalendarDays,
    description: "Aturan penambahan hak cuti tahunan & besar",
  },
  {
    id: "profil",
    name: "Profil Perusahaan",
    href: "/pengaturan/profil",
    icon: Building2,
    description: "Identitas instansi & pejabat penandatangan",
  },
  {
    id: "keamanan",
    name: "Keamanan Akun",
    href: "/pengaturan/keamanan",
    icon: ShieldCheck,
    description: "Kredensial login & ubah kata sandi",
  },
];

export default function PengaturanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman Pengaturan */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Pengaturan Sistem
        </h1>
        <p className="text-xs text-slate-500">
          Kelola ketentuan saldo otomatis, profil unit PG Trangkil, serta keamanan akun Anda.
        </p>
      </div>

      {/* Navigation Tab Bar (4 Pages) */}
      <div className="bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 flex flex-wrap gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            pathname === tab.href ||
            (tab.href === "/pengaturan/kebijakan" && pathname === "/pengaturan");

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex-1 min-w-[170px] flex items-center justify-center sm:justify-start gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none ${
                isActive
                  ? "bg-white text-[#0084c7] shadow-2xs font-bold border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
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

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
}
