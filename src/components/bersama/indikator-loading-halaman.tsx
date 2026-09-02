"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export function IndikatorLoadingHalaman() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showFloatingBadge, setShowFloatingBadge] = useState(false);

  // Reset loading saat URL atau query berubah
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
        setShowFloatingBadge(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, isNavigating]);

  // Handle klik link navigasi internal
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");

      if (!anchor || !anchor.href) return;

      // Jangan cegat link eksternal, new tab, download, atau hash navigasi
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

        // Hanya jalankan jika link berasal dari origin yang sama dan menuju halaman berbeda
        if (
          targetUrl.origin === currentUrl.origin &&
          (targetUrl.pathname !== currentUrl.pathname ||
            targetUrl.search !== currentUrl.search)
        ) {
          setIsNavigating(true);
          setProgress(25);
        }
      } catch {
        // Abaikan URL invalid
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
    };
  }, []);

  // Animasi progress bar saat navigasi berlangsung
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let badgeTimer: NodeJS.Timeout;

    if (isNavigating) {
      // Munculkan floating pill jika proses melebihi 150ms
      badgeTimer = setTimeout(() => {
        setShowFloatingBadge(true);
      }, 150);

      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 60) return prev + 15;
          if (prev < 85) return prev + 5;
          if (prev < 95) return prev + 1;
          return prev;
        });
      }, 200);
    }

    return () => {
      clearInterval(progressInterval);
      clearTimeout(badgeTimer);
    };
  }, [isNavigating]);

  if (!isNavigating && progress === 0) return null;

  return (
    <>
      {/* Top Navigation Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[99999] h-1 bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-sky-400 via-[#0084c7] to-indigo-600 transition-all duration-300 ease-out shadow-sm shadow-sky-500/50"
          style={{
            width: `${progress}%`,
            opacity: progress === 100 ? 0 : 1,
          }}
        />
      </div>

      {/* Floating Animated Badge saat render memakan waktu */}
      {showFloatingBadge && (
        <div className="fixed top-3 right-4 z-[99999] pointer-events-none flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-xl border border-slate-700/60 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
          <span>Memuat Halaman...</span>
        </div>
      )}
    </>
  );
}
