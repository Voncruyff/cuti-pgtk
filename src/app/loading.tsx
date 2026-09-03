export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans">
      {/* 1. Header Skeleton */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/70 py-3">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-28 bg-slate-200/70 rounded-md animate-pulse" />
          </div>
          <div className="h-8 w-20 bg-slate-200/70 rounded-lg animate-pulse" />
        </div>
      </header>

      {/* 2. Body Skeleton */}
      <main className="flex-1 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header Skeleton */}
          <div className="space-y-3">
            <div className="h-5 w-48 bg-slate-200/70 rounded-full mx-auto animate-pulse" />
            <div className="h-8 w-72 sm:w-96 bg-slate-200/80 rounded-xl mx-auto animate-pulse" />
            <div className="h-4 w-64 sm:w-80 bg-slate-100 rounded-md mx-auto animate-pulse" />
          </div>

          {/* Metric Bar Skeleton */}
          <div className="h-16 bg-white rounded-2xl border border-slate-200/70 animate-pulse shadow-2xs" />

          {/* Filter Bar Skeleton */}
          <div className="h-14 bg-white rounded-2xl border border-slate-200/70 animate-pulse shadow-2xs" />

          {/* Table Skeleton */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs">
            <div className="h-8 bg-slate-100/80 rounded-lg animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-slate-50 rounded-lg border border-slate-100 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
