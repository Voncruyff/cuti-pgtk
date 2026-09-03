"use client";

/**
 * Utilitas untuk memicu animasi garis loading di atas header secara manual / programatis
 * Contoh penggunaan:
 *   triggerHeaderLoading(true); // Mulai loading
 *   triggerHeaderLoading(false); // Selesai loading
 */
export function triggerHeaderLoading(start: boolean) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(start ? "header-loading-start" : "header-loading-end")
    );
  }
}
