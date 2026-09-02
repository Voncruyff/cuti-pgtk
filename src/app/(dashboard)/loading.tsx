import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="w-full space-y-6 select-none animate-in fade-in duration-200">
      {/* Top Banner / Loading Header with animated spinner */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center h-10 w-10 shrink-0">
              <div className="h-10 w-10 rounded-full border-3 border-sky-100 border-t-[#0084c7] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-[#0084c7] animate-ping" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">Memuat Halaman...</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-[#0084c7] border border-sky-100">
                  Sinkronisasi
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sistem sedang mengambil data dan menyiapkan tampilan antarmuka
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-8 w-24 bg-slate-200/80 rounded-lg"></div>
            <div className="h-8 w-28 bg-slate-100 rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-2.5 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-slate-200 rounded-md"></div>
              <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
            </div>
            <div className="h-6 w-24 bg-slate-200/90 rounded-md"></div>
            <div className="h-2.5 w-28 bg-slate-100 rounded-md"></div>
          </div>
        ))}
      </div>

      {/* Main Content / Table Skeleton */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {/* Table Header Skeleton */}
        <div className="p-4 border-b border-slate-100/90 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-pulse">
          <div className="space-y-1.5">
            <div className="h-4 w-44 bg-slate-200 rounded-md"></div>
            <div className="h-3 w-64 bg-slate-100 rounded-md"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-36 bg-slate-200/80 rounded-lg"></div>
            <div className="h-8 w-28 bg-slate-200/80 rounded-lg"></div>
            <div className="h-8 w-8 bg-slate-200/80 rounded-lg"></div>
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 bg-slate-100 rounded-md"></div>
                <div className="h-5 w-20 bg-sky-50 rounded-full"></div>
                <div className="space-y-1.5">
                  <div className="h-3.5 w-36 bg-slate-200 rounded-md"></div>
                  <div className="h-2.5 w-24 bg-slate-100 rounded-md"></div>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-5 w-16 bg-slate-100 rounded-md"></div>
                <div className="h-5 w-24 bg-slate-100 rounded-md"></div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-7 w-7 bg-slate-100 rounded-md"></div>
                <div className="h-7 w-7 bg-slate-100 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
