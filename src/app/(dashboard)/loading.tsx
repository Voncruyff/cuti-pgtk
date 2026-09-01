export default function DashboardLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse select-none">
      {/* Top Banner / Header Skeleton */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
            <div className="h-4 w-72 bg-slate-100 rounded-md"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-28 bg-slate-200 rounded-xl"></div>
            <div className="h-9 w-28 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
              <div className="h-8 w-8 bg-sky-100 rounded-xl"></div>
            </div>
            <div className="h-8 w-20 bg-slate-200 rounded-lg"></div>
            <div className="h-3 w-36 bg-slate-100 rounded-md"></div>
          </div>
        ))}
      </div>

      {/* Main Content / Table Skeleton */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="h-5 w-40 bg-slate-200 rounded-md"></div>
          <div className="h-9 w-48 bg-slate-100 rounded-xl"></div>
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-slate-100 rounded-full"></div>
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
                  <div className="h-3 w-24 bg-slate-100 rounded-md"></div>
                </div>
              </div>
              <div className="h-6 w-20 bg-slate-100 rounded-full"></div>
              <div className="h-4 w-16 bg-slate-200 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
