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
    id: "automasi-saldo",
    name: "Automasi Saldo",
    href: "/pengaturan/automasi-saldo",
    icon: CalendarDays,
    description: "Aturan penambahan hak cuti tahunan & besar",
  },
  {
    id: "profil-perusahaan",
    name: "Profil Perusahaan",
    href: "/pengaturan/profil-perusahaan",
    icon: Building2,
    description: "Identitas instansi & pejabat penandatangan",
  },
  {
    id: "keamanan-akun",
    name: "Keamanan Akun",
    href: "/pengaturan/keamanan-akun",
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
          Kelola automasi saldo, profil perusahaan PG Trangkil, serta keamanan akun Anda.
        </p>
      </div>

      {/* Navigation Tab Bar (3 Pages) */}
      <div className="bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 flex flex-wrap gap-1">
        {TABS.map((tab) => {
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

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
}
