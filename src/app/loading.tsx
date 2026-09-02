export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50/70 backdrop-blur-xs select-none">
      <div className="flex flex-col items-center space-y-4 p-6 rounded-2xl bg-white/95 border border-slate-200/80 shadow-xl max-w-xs w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-4 border-sky-100 border-t-[#0084c7] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-[#0084c7] animate-ping" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-slate-800 tracking-tight">Memuat Halaman...</p>
          <p className="text-xs text-slate-400">Sistem Cuti PG Trangkil</p>
        </div>
      </div>
    </div>
  );
}
