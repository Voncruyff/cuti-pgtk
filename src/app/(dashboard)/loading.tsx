import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="w-full space-y-6 select-none animate-in fade-in duration-200">
      {/* Minimal Top Loading Header */}
      <div className="rounded-2xl border border-[#E8F5FC] bg-white p-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-[#0789D1]" />
          <span className="text-xs font-medium text-[#6B7280]">Memuat data...</span>
        </div>
        <div className="flex items-center gap-2 animate-pulse">
          <div className="h-7 w-20 bg-[#F3F6F8] rounded-xl"></div>
          <div className="h-7 w-24 bg-[#E8F5FC] rounded-xl"></div>
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#E8F5FC] bg-white p-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)] space-y-2.5 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-[#F3F6F8] rounded-md"></div>
              <div className="h-8 w-8 bg-[#E8F5FC] rounded-full"></div>
            </div>
            <div className="h-6 w-24 bg-[#F3F6F8] rounded-md"></div>
            <div className="h-2.5 w-28 bg-[#F3F6F8] rounded-md"></div>
          </div>
        ))}
      </div>

      {/* Main Content / Table Skeleton */}
      <div className="rounded-2xl border border-[#E8F5FC] bg-white shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
        {/* Table Header Skeleton */}
        <div className="p-4 border-b border-[#E8F5FC] bg-gradient-to-r from-[#E8F5FC]/30 to-transparent flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-pulse">
          <div className="space-y-1.5">
            <div className="h-4 w-44 bg-[#F3F6F8] rounded-md"></div>
            <div className="h-3 w-64 bg-[#F3F6F8] rounded-md"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-28 bg-[#F3F6F8] rounded-xl"></div>
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between py-2.5 border-b border-[#E8F5FC]/60 last:border-0 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 bg-[#F3F6F8] rounded-md"></div>
                <div className="space-y-1.5">
                  <div className="h-3.5 w-36 bg-[#F3F6F8] rounded-md"></div>
                  <div className="h-2.5 w-24 bg-[#F3F6F8] rounded-md"></div>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-5 w-16 bg-[#E8F5FC] rounded-full"></div>
                <div className="h-5 w-24 bg-[#F3F6F8] rounded-md"></div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-7 w-16 bg-[#F3F6F8] rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
