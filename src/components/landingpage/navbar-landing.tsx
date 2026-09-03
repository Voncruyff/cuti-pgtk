"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NavbarLanding() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-2xl shadow-xs border-b border-[#E8F5FC] py-2.5"
          : "bg-white/80 backdrop-blur-xl border-b border-[#E8F5FC]/80 py-3 sm:py-3.5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center group transition-opacity hover:opacity-90">
          <div className="h-8 sm:h-9 w-auto flex items-center">
            <Image
              src="/assets/PGTrangkilLogo.png"
              alt="Logo PT Kebon Agung - PG Trangkil"
              width={180}
              height={34}
              priority
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </div>
        </Link>

        {/* Login Button using Biru Utama (#0789D1) & Biru Tua hover (#005B96) */}
        <div className="flex items-center gap-2.5">
          <Link href="/login">
            <Button
              size="sm"
              className="bg-[#0789D1] hover:bg-[#005B96] text-white font-semibold text-xs shadow-xs gap-1.5 h-8 sm:h-9 px-3.5 sm:px-4 rounded-xl cursor-pointer transition-all duration-200 border border-[#0789D1]/20"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Login</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
