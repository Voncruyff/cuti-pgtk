"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, LogOut, ChevronDown, User, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SessionUser } from "@/types/auth";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/actions/aksi-autentikasi";
import { motion, AnimatePresence } from "motion/react";
import { dropdownVariants } from "@/lib/motion";
import { useSidebar } from "./konteks-sidebar";

export interface HeaderProps {
  user: SessionUser;
  onOpenMobileMenu?: () => void;
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

  // Otomatis menyesuaikan judul sesuai rute URL yang sedang dibuka
  const getPageTitle = (): string => {
    if (pathname === "/dashboard" || pathname === "/dasbor") {
      return "Dashboard";
    }
    if (pathname === "/ambil-cuti" || pathname === "/ambilcuti" || pathname === "/cuti/buat" || pathname === "/leave/create") {
      return "Pengambilan Cuti";
    }
    if (pathname === "/tambah-saldo-cuti" || pathname === "/tambahsaldocuti" || pathname === "/tambah-saldo" || pathname === "/saldo/tambah" || pathname === "/balances/add") {
      return "Tambah Saldo";
    }
    if (pathname === "/koreksi-cuti" || pathname === "/koreksicuti") {
      return "Koreksi Cuti";
    }
    if (pathname === "/rincian-cuti" || pathname === "/rinciancuti" || pathname === "/cuti/rincian" || pathname === "/leave/details") {
      return "Rincian Cuti";
    }
    if (pathname === "/laporan-cuti" || pathname === "/laporan" || pathname === "/reports" || pathname === "/laporancuti") {
      return "Laporan Cuti";
    }
    if (pathname === "/master-karyawan" || pathname === "/karyawan" || pathname === "/employees" || pathname === "/masterkaryawan") {
      return "Master Karyawan";
    }
    if (pathname === "/master-stasiun" || pathname === "/stasiun" || pathname === "/stations" || pathname === "/masterstasiun") {
      return "Master Stasiun";
    }
    if (pathname === "/master-bagian" || pathname === "/bagian" || pathname === "/departments" || pathname === "/masterbagian") {
      return "Master Bagian";
    }
    if (pathname === "/kelola-user" || pathname === "/pengguna" || pathname === "/users" || pathname === "/kelolauser") {
      return "Kelola User";
    }
    if (pathname.startsWith("/pengaturan") || pathname.startsWith("/settings")) {
      return "Pengaturan Sistem";
    }
    return "SIP-CUTI";
  };

  const pageTitle = getPageTitle();

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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E8F5FC] bg-white/85 backdrop-blur-xl px-4 md:px-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-colors shrink-0 print:hidden">
      {/* Sisi Kiri: Toggle Menu (Mobile & Desktop) & Judul Halaman Bersih */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Tombol Hamburger Mobile */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-full p-1.5 text-[#263238] hover:bg-[#E8F5FC] hover:text-[#005B96] lg:hidden cursor-pointer transition-colors"
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Tombol Toggle Sidebar Desktop */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="hidden lg:flex rounded-full p-2 text-[#6B7280] hover:bg-[#E8F5FC] hover:text-[#005B96] transition-colors cursor-pointer"
          title={isCollapsed ? "Buka Sidebar (Ctrl+B)" : "Tutup Sidebar (Ctrl+B)"}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Info Judul Halaman Dinamis (Minimalis & Elegan) */}
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#263238] tracking-tight">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Sisi Kanan: Profile Dropdown dengan Anak Panah ke Bawah */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-full hover:bg-[#E8F5FC] border border-[#E8F5FC] bg-white/90 shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-[#0789D1]/20 group cursor-pointer"
          aria-expanded={isDropdownOpen}
          aria-label="Menu Pengguna"
        >
          {/* Avatar (Foto Profil atau Inisial) */}
          {user.fotoProfil ? (
            <img
              src={user.fotoProfil}
              alt={user.fullName || user.username}
              className="h-8 w-8 rounded-full object-cover border border-[#E8F5FC] shadow-xs select-none shrink-0"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#0789D1] to-[#005B96] text-white text-xs font-bold shadow-xs select-none shrink-0">
              {getInitials(user.fullName || user.username)}
            </div>
          )}

          {/* Nama & Role */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-[#263238] leading-tight">
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
            className={`h-4 w-4 text-[#6B7280] group-hover:text-[#263238] transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180 text-[#0789D1]" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu Popup with Smooth Motion */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              variants={dropdownVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute right-0 mt-2 w-60 bg-white/95 backdrop-blur-xl rounded-2xl border border-[#E8F5FC] shadow-xl py-1.5 z-50 origin-top-right"
            >
              {/* Header User Detail di dalam dropdown */}
              <div className="px-3.5 py-3 border-b border-[#E8F5FC] flex items-center gap-3">
              {user.fotoProfil ? (
                <img
                  src={user.fotoProfil}
                  alt={user.fullName || user.username}
                  className="h-10 w-10 rounded-full object-cover border border-[#E8F5FC] shadow-2xs shrink-0"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#0789D1] to-[#005B96] text-white text-xs font-bold shadow-2xs shrink-0 select-none">
                  {getInitials(user.fullName || user.username)}
                </div>
              )}
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-bold text-[#263238] truncate">
                  {user.fullName || user.username}
                </p>
                <p className="text-[11px] text-[#6B7280] font-mono mt-0.5 truncate">
                  @{user.username}
                </p>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#005B96] bg-[#E8F5FC] px-2 py-0.5 rounded border border-[#0789D1]/20">
                    <Shield className="h-2.5 w-2.5 text-[#0789D1]" />
                    {getRoleLabel()}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Navigasi & Aksi */}
            <div className="p-1 space-y-0.5">
              <Link
                href="/pengaturan/keamanan-akun"
                onClick={() => setIsDropdownOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#263238] hover:text-[#005B96] hover:bg-[#E8F5FC] rounded-lg transition-colors group text-left"
              >
                <User className="h-4 w-4 text-[#6B7280] group-hover:text-[#0789D1] transition-colors" />
                <span>Pengaturan Akun</span>
              </Link>

              <div className="my-1 border-t border-[#E8F5FC]" />

              <button
                type="button"
                onClick={handleLogout}
                disabled={isPending}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors group text-left disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                ) : (
                  <LogOut className="h-4 w-4 text-rose-500 group-hover:text-rose-700 transition-transform group-hover:translate-x-0.5" />
                )}
                <span>Keluar</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </header>
);
}
