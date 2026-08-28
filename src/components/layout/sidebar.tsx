"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  Layers,
  FileSpreadsheet,
  Users,
  Building2,
  FileText,
  UserCog,
  CalendarRange,
  ShieldCheck,
  Settings,
  CalendarCheck,
  X,
} from "lucide-react";
import { SessionUser } from "@/types/auth";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

export interface SidebarProps {
  user: SessionUser;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ user, isOpen: propIsOpen, onClose: propOnClose }: SidebarProps) {
  const pathname = usePathname();
  const context = useSidebar();

  const isOpen = propIsOpen !== undefined ? propIsOpen : context.isOpen;
  const onClose = propOnClose || context.close;
  const isMainAdmin = user.role === "ADMIN_UTAMA";

  const navigation = [
    {
      title: "Menu Utama",
      items: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
        },
      ],
    },
    {
      title: "Transaksi",
      items: [
        {
          name: "Pengambilan Cuti",
          href: "/leave/create",
          icon: CalendarDays,
          roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
        },
        {
          name: "Tambah Saldo",
          href: "/balances/add",
          icon: PlusCircle,
          roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
        },
        {
          name: "Proses Massal",
          href: "/mass-process",
          icon: Layers,
          roles: ["ADMIN_UTAMA"],
        },
      ],
    },
    {
      title: "Data",
      items: [
        {
          name: "Rincian Cuti",
          href: "/leave/details",
          icon: FileSpreadsheet,
          roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
        },
        {
          name: "Master Karyawan",
          href: "/employees",
          icon: Users,
          roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
        },
        {
          name: "Master Bagian",
          href: "/departments",
          icon: Building2,
          roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
        },
      ],
    },
    {
      title: "Laporan",
      items: [
        {
          name: "Rekap Cuti",
          href: "/reports/summary",
          icon: FileText,
          roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
        },
      ],
    },
    ...(isMainAdmin
      ? [
          {
            title: "Administrasi",
            items: [
              {
                name: "Kelola User",
                href: "/users",
                icon: UserCog,
                roles: ["ADMIN_UTAMA"],
              },
              {
                name: "Jenis Cuti",
                href: "/leave-types",
                icon: CalendarRange,
                roles: ["ADMIN_UTAMA"],
              },
              {
                name: "Hari Libur",
                href: "/holidays",
                icon: CalendarCheck,
                roles: ["ADMIN_UTAMA"],
              },
              {
                name: "Audit Log",
                href: "/audit",
                icon: ShieldCheck,
                roles: ["ADMIN_UTAMA"],
              },
              {
                name: "Pengaturan",
                href: "/settings",
                icon: Settings,
                roles: ["ADMIN_UTAMA"],
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container mandiri */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:h-full lg:translate-x-0 lg:transition-none shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header / Brand */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 font-bold text-white shadow-xs">
              PG
            </div>
            <div>
              <div className="text-xs font-bold tracking-tight text-slate-900 leading-tight">
                PG TRANGKIL
              </div>
              <div className="text-[10px] text-slate-500 font-medium leading-tight">
                Sistem Cuti Pimpinan
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navigation.map((section) => {
            const visibleItems = section.items.filter((item) =>
              item.roles.includes(user.role)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-blue-600" : "text-slate-400"
                        )}
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-200 p-3">
          <div className="rounded-md bg-slate-50 p-2 text-center border border-slate-100">
            <p className="text-[11px] font-medium text-slate-700">PG Trangkil Pati</p>
            <p className="text-[10px] text-slate-400">Internal Server LAN/WLAN</p>
          </div>
        </div>
      </aside>
    </>
  );
}
