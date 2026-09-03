"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Komponen Indikator Loading di Bagian Paling Atas Layar (Edge-to-Edge Full Width)
 * Berjalan melintang di atas sidebar logo dan header secara menyeluruh
 * saat berpindah halaman atau saat memuat data.
 */
export function IndikatorLoadingHalaman() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevPathRef = useRef(pathname);
  const prevSearchRef = useRef(searchParams?.toString());
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopLoading = useCallback(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    setProgress(100);

    fadeTimerRef.current = setTimeout(() => {
      setVisible(false);
      setLoading(false);
      setProgress(0);
    }, 350);
  }, []);

  const startLoading = useCallback(() => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);

    // Jadwalkan state update secara asinkron agar tidak memicu error useInsertionEffect di React 19
    setTimeout(() => {
      setVisible(true);
      setLoading(true);
      setProgress(25);
    }, 0);

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 60) return prev + 8;
        if (prev < 80) return prev + 4;
        if (prev < 95) return prev + 1;
        return prev;
      });
    }, 150);

    // Timeout pengaman otomatis jika navigasi gagal / dibatalkan
    safetyTimerRef.current = setTimeout(() => {
      stopLoading();
    }, 10000);
  }, [stopLoading]);

  // Hanya stop loading saat URL atau query params benar-benar BERUBAH (halaman baru selesai di-render)
  useEffect(() => {
    const currentSearch = searchParams?.toString();
    if (
      pathname !== prevPathRef.current ||
      currentSearch !== prevSearchRef.current
    ) {
      prevPathRef.current = pathname;
      prevSearchRef.current = currentSearch;
      stopLoading();
    }
  }, [pathname, searchParams, stopLoading]);

  useEffect(() => {
    // Tangkap klik pada link internal <a>
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");

      if (!anchor || !anchor.href) return;

      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("rel") === "external" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        if (
          targetUrl.origin === currentUrl.origin &&
          (targetUrl.pathname !== currentUrl.pathname ||
            targetUrl.search !== currentUrl.search)
        ) {
          startLoading();
        }
      } catch {
        // ignore
      }
    };

    // Dengarkan event manual / programatis
    const onStart = () => startLoading();
    const onStop = () => stopLoading();

    window.addEventListener("header-loading-start", onStart);
    window.addEventListener("header-loading-end", onStop);
    window.addEventListener("app-loading-start", onStart);
    window.addEventListener("app-loading-end", onStop);

    document.addEventListener("click", handleAnchorClick, { capture: true });

    return () => {
      window.removeEventListener("header-loading-start", onStart);
      window.removeEventListener("header-loading-end", onStop);
      window.removeEventListener("app-loading-start", onStart);
      window.removeEventListener("app-loading-end", onStop);
      document.removeEventListener("click", handleAnchorClick, { capture: true });
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [startLoading, stopLoading]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999999] pointer-events-none select-none"
      style={{ height: "3.5px" }}
      aria-hidden="true"
    >
      <div className="w-full h-full relative overflow-hidden bg-sky-100/30">
        {/* Progress Bar dengan Gradien Khas PGTK dan Efek Glow di Ujung Bar */}
        <div
          className="h-full bg-gradient-to-r from-[#0093dc] via-[#38bdf8] to-[#005B96] transition-all duration-200 ease-out relative"
          style={{
            width: `${progress}%`,
            opacity: progress === 100 ? 0 : 1,
            transition: progress === 100 ? "all 300ms ease-out" : "all 200ms ease-out",
            boxShadow: "0 0 12px #0093dc, 0 0 6px #38bdf8",
          }}
        >
          {/* Efek Kilau Cahaya (Pulse Shimmer) di Ujung Depan Garis */}
          <div className="absolute right-0 top-0 bottom-0 w-28 bg-gradient-to-r from-transparent via-white/50 to-white opacity-80 shadow-[0_0_15px_#ffffff]" />
        </div>
      </div>
    </div>
  );
}
