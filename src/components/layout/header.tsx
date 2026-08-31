"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, LogOut, ChevronDown, User, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SessionUser } from "@/types/auth";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/actions/auth-actions";
import { useSidebar } from "./sidebar-context";

export interface HeaderProps {
  user: SessionUser;
  onOpenMobileMenu?: () => void;
}

interface PageMeta {
  title: string;
  category: string;
}

export function Header({ user, onOpenMobileMenu: propOnOpen }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { open, toggleCollapse, isCollapsed } = useSidebar();
  const onOpenMobileMenu = propOnOpen || open;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
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

  // Otomatis menyesuaikan judul & kategori sesuai rute URL yang sedang dibuka
  const getPageMeta = (): PageMeta => {
    if (pathname === "/dashboard") {
      return { title: "Dashboard", category: "MENU UTAMA" };
    }
    if (pathname === "/leave/create") {
      return { title: "Pengambilan Cuti", category: "TRANSAKSI" };
    }
    if (pathname === "/balances/add") {
      return { title: "Tambah Saldo Cuti", category: "TRANSAKSI" };
    }
    if (pathname === "/leave/details") {
      return { title: "Rincian & Histori Cuti", category: "DATA" };
    }
    if (pathname === "/reports") {
      return { title: "Laporan Cuti & Ledger", category: "LAPORAN" };
    }
    if (pathname === "/employees") {
      return { title: "Master Karyawan", category: "MASTER DATA" };
    }
    if (pathname === "/stations") {
      return { title: "Master Stasiun", category: "MASTER DATA" };
    }
    if (pathname === "/departments") {
      return { title: "Master Bagian", category: "MASTER DATA" };
    }
    if (pathname === "/mass-process") {
      return { title: "Proses Cuti Massal", category: "TRANSAKSI" };
    }
    if (pathname === "/users") {
      return { title: "Kelola Pengguna", category: "ADMINISTRASI" };
    }
    if (pathname === "/settings") {
      return { title: "Pengaturan Sistem", category: "ADMINISTRASI" };
    }
    return { title: "SIP-CUTI", category: "PG TRANGKIL" };
  };

  const pageMeta = getPageMeta();

  const getRoleLabel = () => {
    if (user.role === "ADMIN_UTAMA") return "Admin Utama";
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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/85 backdrop-blur-md px-4 md:px-6 shadow-2xs transition-colors shrink-0">
      {/* Sisi Kiri: Toggle Menu (Mobile & Desktop) & Judul Halaman Dinamis */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Tombol Hamburger Mobile */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-full p-1.5 text-slate-600 hover:bg-sky-50 hover:text-[#0084c7] lg:hidden cursor-pointer"
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Tombol Toggle Sidebar Desktop */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="hidden lg:flex rounded-full p-2 text-slate-500 hover:bg-sky-50 hover:text-[#0084c7] transition-colors cursor-pointer"
          title={isCollapsed ? "Buka Sidebar (Ctrl+B)" : "Tutup Sidebar (Ctrl+B)"}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Info Judul Halaman Dinamis */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0077b6] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/80">
              • PG TRANGKIL • {pageMeta.category}
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

      {/* Sisi Kanan: Profile Dropdown dengan Anak Panah ke Bawah */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-full hover:bg-sky-50/70 border border-slate-200/70 bg-white/90 shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/20 group cursor-pointer"
          aria-expanded={isDropdownOpen}
          aria-label="Menu Pengguna"
        >
          {/* Avatar Inisial */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#0084c7] to-[#0093dc] text-white text-xs font-bold shadow-xs select-none shrink-0">
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
                className="text-[9px] px-2 py-0 h-4 font-semibold"
              >
                {getRoleLabel()}
              </Badge>
            </div>
          </div>

          {/* Anak Panah ke Bawah (ChevronDown) */}
          <ChevronDown
            className={`h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180 text-[#0084c7]" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu Popup */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200/90 shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Header User Detail di dalam dropdown */}
            <div className="px-3.5 py-2.5 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user.fullName || user.username}
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                @{user.username}
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  <Shield className="h-3 w-3 text-blue-600" />
                  {getRoleLabel()}
                </span>
              </div>
            </div>

            {/* Menu Aksi Logout */}
            <div className="p-1">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isPending}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors group text-left disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                ) : (
                  <LogOut className="h-4 w-4 text-rose-500 group-hover:text-rose-700 transition-transform group-hover:translate-x-0.5" />
                )}
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
