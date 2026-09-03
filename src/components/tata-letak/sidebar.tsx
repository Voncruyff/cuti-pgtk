"use client";

import { useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCog,
  PlusCircle,
  FileSpreadsheet,
  Users,
  Building2,
  Factory,
  FileText,
  UserCog,
  Settings,
  X,
} from "lucide-react";
import { SessionUser } from "@/types/autentikasi";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useSidebar } from "./konteks-sidebar";

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
          href: "/ambil-cuti",
          icon: CalendarDays,
          roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
        },
        {
          name: "Tambah Saldo",
          href: "/tambah-saldo-cuti",
          icon: PlusCircle,
          roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
        },
        {
          name: "Koreksi Cuti",
          href: "/koreksi-cuti",
          icon: CalendarCog,
          roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
        },
      ],
    },
    {
      title: "Data",
      items: [
        {
          name: "Rincian Cuti",
          href: "/rincian-cuti",
          icon: FileSpreadsheet,
          roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
        },
        {
          name: "Master Karyawan",
          href: "/master-karyawan",
          icon: Users,
          roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
        },
        {
          name: "Master Stasiun",
          href: "/master-stasiun",
          icon: Factory,
          roles: ["ADMIN_UTAMA", "ADMIN_BAGIAN"],
        },
        {
          name: "Master Bagian",
          href: "/master-bagian",
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
          href: "/laporan-cuti",
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
                href: "/kelola-user",
                icon: UserCog,
                roles: ["ADMIN_UTAMA"],
              },
              {
                name: "Pengaturan",
                href: "/pengaturan",
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
      {/* Mobile backdrop with Smooth Motion Fade */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="sidebar-mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container (Full-Height) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#E8F5FC] bg-white transition-[width,transform] duration-300 ease-in-out lg:static lg:h-full shrink-0 select-none print:hidden",
          // Mobile state
          isOpen ? "translate-x-0 w-64 shadow-xl" : "-translate-x-full lg:translate-x-0",
          // Desktop state (Collapsed vs Expanded)
          isCollapsed ? "lg:w-[72px]" : "lg:w-64"
        )}
      >
        {/* Header / Brand (Tinggi h-16 Presisi Selaras dengan Top Navbar) */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-[#E8F5FC] transition-all shrink-0",
            isCollapsed ? "justify-center px-2" : "justify-between px-5"
          )}
        >
          {isCollapsed ? (
            /* BRAND KETIKA SIDEBAR DITUTUP (LOGO KEBON AGUNG - LINK KE DASHBOARD) */
            <Link
              href="/dashboard"
              className="group relative flex h-11 w-11 items-center justify-center rounded-full p-1.5 hover:bg-[#E8F5FC] transition-all cursor-pointer"
              title="Dashboard - PT Kebon Agung"
            >
              <Image
                src="/assets/KebonAgungLogo.png"
                alt="PT Kebon Agung"
                width={36}
                height={36}
                sizes="36px"
                priority
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
                className="flex items-center group cursor-pointer h-8 max-w-[200px]"
                title="Dashboard - PG Trangkil"
              >
                <Image
                  src="/assets/PGTrangkilLogo.png"
                  alt="PT Kebon Agung - PG Trangkil"
                  width={200}
                  height={34}
                  priority
                  className="h-8 w-auto max-w-[190px] object-contain object-left group-hover:opacity-90 transition-opacity"
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
                  sIdx > 0 && <div className="my-2 border-t border-[#E8F5FC] w-8 mx-auto" />
                ) : (
                  <div className="px-3.5 pt-1 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280] select-none">
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
                        prefetch={true}
                        onClick={onClose}
                        className={cn(
                          "group relative flex h-10 w-10 items-center justify-center rounded-full transition-[color,background-color,box-shadow,transform] duration-150 active:scale-95 mx-auto my-1 cursor-pointer",
                          isActive
                            ? "bg-[#0789D1] text-white shadow-xs shadow-[#0789D1]/20 scale-105"
                            : "text-[#263238] hover:bg-[#E8F5FC] hover:text-[#005B96]"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {/* Floating tooltip on hover with scale transition */}
                        <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 origin-left pointer-events-none transition-[opacity,transform] duration-150 z-50">
                          {item.name}
                        </span>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      prefetch={true}
                      onClick={onClose}
                      className={cn(
                        "group flex items-center gap-3 rounded-full px-3.5 py-2.5 text-xs font-semibold transition-[color,background-color,box-shadow,transform] duration-150 active:scale-[0.98] cursor-pointer",
                        isActive
                          ? "bg-[#0789D1] text-white font-bold shadow-xs shadow-[#0789D1]/20"
                          : "text-[#263238] hover:bg-[#E8F5FC] hover:text-[#005B96]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive ? "text-white" : "text-[#6B7280] group-hover:text-[#005B96]"
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
