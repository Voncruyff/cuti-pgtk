"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, LogOut, ShieldCheck, UserCheck, Calendar } from "lucide-react";
import { toast } from "sonner";
import { SessionUser } from "@/types/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth-actions";
import { useSidebar } from "./sidebar-context";

export interface HeaderProps {
  user: SessionUser;
  onOpenMobileMenu?: () => void;
}

interface PageMeta {
  title: string;
  category: string;
  badgeColor?: string;
}

export function Header({ user, onOpenMobileMenu: propOnOpen }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { open } = useSidebar();
  const onOpenMobileMenu = propOnOpen || open;

  const handleLogout = () => {
    startTransition(async () => {
      const res = await logoutAction();
      if (res.success) {
        toast.success("Berhasil keluar.");
        router.push("/login");
        router.refresh();
      } else {
        toast.error("Gagal logout.");
      }
    });
  };

  // Logika penyesuaian judul header untuk setiap halaman secara dinamis
  const getPageMeta = (): PageMeta => {
    if (pathname === "/dashboard") {
      return {
        title: "Dashboard Utama",
        category: "Menu Utama",
      };
    }
    if (pathname.startsWith("/leave/create")) {
      return {
        title: "Pengambilan Cuti",
        category: "Transaksi",
      };
    }
    if (pathname.startsWith("/balances/add")) {
      return {
        title: "Tambah Saldo Cuti",
        category: "Transaksi",
      };
    }
    if (pathname.startsWith("/mass-process")) {
      return {
        title: "Proses Cuti Massal",
        category: "Transaksi",
      };
    }
    if (pathname.startsWith("/leave/details")) {
      return {
        title: "Rincian Mutasi Cuti",
        category: "Data Cuti",
      };
    }
    if (pathname.startsWith("/employees")) {
      return {
        title: "Master Karyawan",
        category: "Data Master",
      };
    }
    if (pathname.startsWith("/departments")) {
      return {
        title: "Master Bagian",
        category: "Data Master",
      };
    }
    if (pathname.startsWith("/reports/summary") || pathname.startsWith("/reports")) {
      return {
        title: "Rekapitulasi Cuti",
        category: "Laporan",
      };
    }
    if (pathname.startsWith("/users")) {
      return {
        title: "Kelola User Pengguna",
        category: "Administrasi",
      };
    }
    if (pathname.startsWith("/leave-types")) {
      return {
        title: "Master Jenis Cuti",
        category: "Administrasi",
      };
    }
    if (pathname.startsWith("/holidays")) {
      return {
        title: "Master Hari Libur",
        category: "Administrasi",
      };
    }
    if (pathname.startsWith("/audit")) {
      return {
        title: "Audit Log & Aktivitas",
        category: "Administrasi",
      };
    }
    if (pathname.startsWith("/settings")) {
      return {
        title: "Pengaturan Sistem",
        category: "Administrasi",
      };
    }

    return {
      title: "Sistem Cuti PG Trangkil",
      category: "Aplikasi",
    };
  };

  const pageMeta = getPageMeta();

  const getRoleLabel = () => {
    if (user.role === "ADMIN_UTAMA") {
      return "Admin Utama (ALL)";
    }
    return user.department ? `Admin Bagian ${user.department}` : "Admin Bagian";
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-xs px-4 md:px-6 shadow-2xs transition-colors">
      {/* Kiri: Toggle Mobile & Judul Halaman Dinamis */}
      <div className="flex items-center gap-3">
        {/* Tombol Hamburger Mobile */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Info Judul Halaman Dinamis */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm border border-blue-100">
              {pageMeta.category}
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
              {pageMeta.title}
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
            Sistem Informasi Pengelolaan Cuti — Pabrik Gula Trangkil
          </p>
        </div>
      </div>

      {/* Kanan: Info Akun User & Tombol Keluar */}
      <div className="flex items-center gap-3">
        {/* Identitas Operator Aktif */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 sm:border-l-0">
          {/* Avatar Inisial */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-blue-500 text-white text-xs font-bold shadow-xs select-none">
            {getInitials(user.fullName || user.username)}
          </div>

          {/* Nama & Role */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {user.fullName || user.username}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge
                variant={user.role === "ADMIN_UTAMA" ? "default" : "secondary"}
                className="text-[9px] px-1.5 py-0 h-4 font-medium"
              >
                {getRoleLabel()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tombol Logout */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={isPending}
          className="h-8 gap-1.5 text-xs text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
          title="Keluar dari akun"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Keluar</span>
        </Button>
      </div>
    </header>
  );
}
