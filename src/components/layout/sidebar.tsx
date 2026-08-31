"use client";

import { useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  Layers,
  FileSpreadsheet,
  Users,
  Building2,
  Factory,
  FileText,
  UserCog,
  Settings,
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
  const router = useRouter();
  const pathname = usePathname();
  const context = useSidebar();
  const [isPending, startTransition] = useTransition();

  const isOpen = propIsOpen !== undefined ? propIsOpen : context.isOpen;
  const onClose = propOnClose || context.close;
  const { isCollapsed, toggleCollapse } = context;
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
        ...(isMainAdmin
          ? [
              {
                name: "Proses Massal",
                href: "/mass-process",
                icon: Layers,
                roles: ["ADMIN_UTAMA"],
              },
            ]
          : []),
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
          name: "Master Stasiun",
          href: "/stations",
          icon: Factory,
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
          name: "Laporan Cuti",
          href: "/reports",
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
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar Container (Full-Height) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out lg:static lg:h-full shrink-0 select-none",
          // Mobile state
          isOpen ? "translate-x-0 w-64 shadow-xl" : "-translate-x-full lg:translate-x-0",
          // Desktop state (Collapsed vs Expanded)
          isCollapsed ? "lg:w-[72px]" : "lg:w-64"
        )}
      >
        {/* Header / Brand (Tinggi h-16 Presisi Selaras dengan Top Navbar) */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-slate-200/80 transition-all shrink-0",
            isCollapsed ? "justify-center px-2" : "justify-between px-5"
          )}
        >
          {isCollapsed ? (
            /* BRAND KETIKA SIDEBAR DITUTUP (LOGO KEBON AGUNG - LINK KE DASHBOARD) */
            <Link
              href="/dashboard"
              className="group relative flex h-11 w-11 items-center justify-center rounded-full p-1.5 hover:bg-sky-50 transition-all cursor-pointer"
              title="Dashboard - PT Kebon Agung"
            >
              <Image
                src="/assets/KebonAgungLogo.png"
                alt="PT Kebon Agung"
                width={36}
                height={36}
                className="h-8 w-8 object-contain transition-transform group-hover:scale-110"
              />
              {/* Tooltip */}
              <span className="absolute left-full ml-3 hidden group-hover:block px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg whitespace-nowrap z-50">
                Dashboard (Beranda)
              </span>
            </Link>
          ) : (
            /* BRAND KETIKA SIDEBAR DIBUKA (LOGO PG TRANGKIL - LINK KE DASHBOARD) */
            <div className="flex items-center justify-between w-full">
              <Link
                href="/dashboard"
                className="relative w-full max-w-[200px] h-[34px] flex items-center group cursor-pointer"
                title="Dashboard - PG Trangkil"
              >
                <Image
                  src="/assets/PGTrangkilLogo.png"
                  alt="PT Kebon Agung - PG Trangkil"
                  fill
                  priority
                  className="object-contain object-left group-hover:opacity-90 transition-opacity"
                />
              </Link>

              {/* Tombol Tutup Khusus Mobile */}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 hover:bg-sky-50 hover:text-[#0084c7] lg:hidden cursor-pointer shrink-0 ml-2"
                title="Tutup Menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-4">
          {navigation.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) =>
              item.roles.includes(user.role)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                {isCollapsed ? (
                  sIdx > 0 && <div className="my-2 border-t border-slate-100 w-8 mx-auto" />
                ) : (
                  <div className="px-3.5 pt-1 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 select-none">
                    {section.title}
                  </div>
                )}

                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));
                  const Icon = item.icon;

                  if (isCollapsed) {
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "group relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-150 mx-auto my-1 cursor-pointer",
                          isActive
                            ? "bg-[#0084c7] text-white shadow-xs shadow-sky-500/25 scale-105"
                            : "text-slate-600 hover:bg-sky-50/70 hover:text-[#0077b6]"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {/* Floating tooltip on hover */}
                        <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                          {item.name}
                        </span>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "group flex items-center gap-3 rounded-full px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer",
                        isActive
                          ? "bg-[#0084c7] text-white font-bold shadow-xs shadow-sky-500/20"
                          : "text-slate-600 hover:bg-sky-50/70 hover:text-[#0077b6]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive ? "text-white" : "text-slate-400 group-hover:text-[#0084c7]"
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
