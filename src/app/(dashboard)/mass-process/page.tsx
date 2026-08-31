"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Layers,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Users,
  Building2,
  Factory,
  ArrowRight,
  ShieldAlert,
  Loader2,
  CalendarCheck,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getMassProcessMetaAction,
  previewMassProcessEmployeesAction,
  executeMassAnnualLeaveAllocationAction,
  executeMassLongLeaveAllocationAction,
  executeMassRollForwardAction,
  getMassProcessHistoryAction,
  PreviewEmployeeItem,
  MassProcessHistoryItem,
} from "@/actions/mass-process-actions";
import { formatDateIndo } from "@/lib/utils";

export default function MassProcessPage() {
  const [activeTab, setActiveTab] = useState<"ANNUAL" | "LONG_LEAVE" | "ROLL_FORWARD" | "HISTORY">("ANNUAL");
  const [isPending, startTransition] = useTransition();
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);

  // Metadata
  const [departments, setDepartments] = useState<{ id: string; code: string; name: string }[]>([]);
  const [stations, setStations] = useState<{ id: string; code: string; name: string; departmentName: string }[]>([]);
  const [totalActiveEmployees, setTotalActiveEmployees] = useState(0);

  // Tab 1: Annual Leave Form State
  const [annualCategory, setAnnualCategory] = useState("ALL");
  const [annualDept, setAnnualDept] = useState("ALL");
  const [annualStation, setAnnualStation] = useState("ALL");
  const [annualDays, setAnnualDays] = useState(12);
  const [annualYear, setAnnualYear] = useState(new Date().getFullYear());
  const [annualUraian, setAnnualUraian] = useState("");
  const [annualPreviewItems, setAnnualPreviewItems] = useState<PreviewEmployeeItem[]>([]);
  const [annualPreviewLoaded, setAnnualPreviewLoaded] = useState(false);

  // Tab 2: Long Leave Form State
  const [longCategory, setLongCategory] = useState("ALL");
  const [longDept, setLongDept] = useState("ALL");
  const [longDays, setLongDays] = useState(22);
  const [longUraian, setLongUraian] = useState("");
  const [longPreviewItems, setLongPreviewItems] = useState<PreviewEmployeeItem[]>([]);
  const [longPreviewLoaded, setLongPreviewLoaded] = useState(false);

  // Tab 3: Roll Forward Form State
  const [rollNewYear, setRollNewYear] = useState(new Date().getFullYear() + 1);
  const [rollResetAnnual, setRollResetAnnual] = useState(true);
  const [rollDefaultAnnual, setRollDefaultAnnual] = useState(12);
  const [rollUraian, setRollUraian] = useState("");
  const [rollPreviewItems, setRollPreviewItems] = useState<PreviewEmployeeItem[]>([]);
  const [rollPreviewLoaded, setRollPreviewLoaded] = useState(false);

  // Tab 4: History State
  const [historyItems, setHistoryItems] = useState<MassProcessHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Modal Confirmation State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<"ANNUAL" | "LONG_LEAVE" | "ROLL_FORWARD" | null>(null);

  // Load Metadata on mount
  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    setIsLoadingMeta(true);
    const res = await getMassProcessMetaAction();
    if (res.success && res.data) {
      setDepartments(res.data.departments);
      setStations(res.data.stations);
      setTotalActiveEmployees(res.data.totalActiveEmployees);
    } else {
      toast.error(res.message || "Gagal memuat metadata proses massal.");
    }
    setIsLoadingMeta(false);
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    const res = await getMassProcessHistoryAction();
    if (res.success && res.data) {
      setHistoryItems(res.data);
    }
    setIsLoadingHistory(false);
  };

  // Preview Annual Leave
  const handlePreviewAnnual = () => {
    startTransition(async () => {
      const res = await previewMassProcessEmployeesAction(
        { category: annualCategory, department: annualDept, station: annualStation },
        "ANNUAL",
        Number(annualDays) || 12
      );
      if (res.success && res.data) {
        setAnnualPreviewItems(res.data.items);
        setAnnualPreviewLoaded(true);
        toast.success(`Ditemukan ${res.data.totalCount} karyawan yang memenuhi syarat.`);
      } else {
        toast.error(res.message || "Gagal memproses pratinjau.");
      }
    });
  };

  // Preview Long Leave
  const handlePreviewLong = () => {
    startTransition(async () => {
      const res = await previewMassProcessEmployeesAction(
        { category: longCategory, department: longDept },
        "LONG_LEAVE",
        Number(longDays) || 22
      );
      if (res.success && res.data) {
        setLongPreviewItems(res.data.items);
        setLongPreviewLoaded(true);
        toast.success(`Ditemukan ${res.data.totalCount} karyawan untuk penambahan cuti besar.`);
      } else {
        toast.error(res.message || "Gagal memproses pratinjau.");
      }
    });
  };

  // Preview Roll Forward
  const handlePreviewRoll = () => {
    startTransition(async () => {
      const res = await previewMassProcessEmployeesAction(
        {},
        "ROLL_FORWARD",
        rollResetAnnual ? Number(rollDefaultAnnual) : 0
      );
      if (res.success && res.data) {
        setRollPreviewItems(res.data.items);
        setRollPreviewLoaded(true);
        toast.success(`Pratinjau pergantian tahun untuk ${res.data.totalCount} karyawan aktif.`);
      } else {
        toast.error(res.message || "Gagal memproses pratinjau.");
      }
    });
  };

  // Execute Action
  const handleExecuteConfirmed = () => {
    if (!confirmTarget) return;
    setIsConfirmModalOpen(false);

    startTransition(async () => {
      if (confirmTarget === "ANNUAL") {
        const res = await executeMassAnnualLeaveAllocationAction({
          filters: { category: annualCategory, department: annualDept, station: annualStation },
          amount: Number(annualDays),
          year: Number(annualYear),
          uraian: annualUraian,
        });
        if (res.success) {
          toast.success(res.message || "Eksekusi pemberian cuti tahunan massal berhasil!");
          setAnnualPreviewLoaded(false);
          setAnnualPreviewItems([]);
          loadMetadata();
        } else {
          toast.error(res.message || "Gagal mengeksekusi.");
        }
      } else if (confirmTarget === "LONG_LEAVE") {
        const res = await executeMassLongLeaveAllocationAction({
          filters: { category: longCategory, department: longDept },
          amount: Number(longDays),
          uraian: longUraian,
        });
        if (res.success) {
          toast.success(res.message || "Eksekusi penambahan cuti besar massal berhasil!");
          setLongPreviewLoaded(false);
          setLongPreviewItems([]);
          loadMetadata();
        } else {
          toast.error(res.message || "Gagal mengeksekusi.");
        }
      } else if (confirmTarget === "ROLL_FORWARD") {
        const res = await executeMassRollForwardAction({
          newYear: Number(rollNewYear),
          defaultAnnualAmount: Number(rollDefaultAnnual),
          resetAnnual: rollResetAnnual,
          uraian: rollUraian,
        });
        if (res.success) {
          toast.success(res.message || "Roll-forward periode tahun baru berhasil!");
          setRollPreviewLoaded(false);
          setRollPreviewItems([]);
          loadMetadata();
        } else {
          toast.error(res.message || "Gagal mengeksekusi roll-forward.");
        }
      }
    });
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0077b6] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/80">
              • MODUL ADMINISTRASI UTAMA
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Proses Cuti Massal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Otomatisasi pemberian kuota cuti tahunan massal, cuti besar, dan pergantian periode tahun karyawan PG Trangkil.
          </p>
        </div>

        {/* Total Active Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Badge variant="outline" className="px-3 py-1 bg-white border-slate-200 text-xs font-semibold">
            <Users className="h-3.5 w-3.5 mr-1.5 text-[#0084c7]" />
            Total Karyawan Aktif: <span className="font-bold font-mono ml-1 text-slate-900">{totalActiveEmployees}</span>
          </Badge>
        </div>
      </div>

      {/* Tabs Switcher Kapsul */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 rounded-full border border-slate-200/80 overflow-x-auto w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("ANNUAL")}
          className={`px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "ANNUAL"
              ? "bg-[#0084c7] text-white shadow-xs"
              : "text-slate-600 hover:text-[#0077b6] hover:bg-white/60"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          1. Kuota Tahunan Massal
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("LONG_LEAVE")}
          className={`px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "LONG_LEAVE"
              ? "bg-[#0084c7] text-white shadow-xs"
              : "text-slate-600 hover:text-[#0077b6] hover:bg-white/60"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          2. Cuti Besar Massal
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ROLL_FORWARD")}
          className={`px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "ROLL_FORWARD"
              ? "bg-[#0084c7] text-white shadow-xs"
              : "text-slate-600 hover:text-[#0077b6] hover:bg-white/60"
          }`}
        >
          <RotateCw className="h-3.5 w-3.5" />
          3. Pergantian Tahun (Roll-Forward)
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("HISTORY");
            loadHistory();
          }}
          className={`px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "HISTORY"
              ? "bg-[#0084c7] text-white shadow-xs"
              : "text-slate-600 hover:text-[#0077b6] hover:bg-white/60"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          4. Riwayat Eksekusi
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PEMBERIAN CUTI TAHUNAN MASSAL                      */}
      {/* ======================================================== */}
      {activeTab === "ANNUAL" && (
        <div className="space-y-6">
          {/* Card Form Konfigurasi Filter */}
          <Card className="border-slate-200/85 shadow-2xs">
            <CardHeader className="py-3.5 px-5 bg-gradient-to-r from-sky-50/50 via-slate-50/20 to-transparent border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-[#0084c7]" />
                Konfigurasi Penambahan Kuota Cuti Tahunan
              </CardTitle>
              <CardDescription className="text-xs">
                Tentukan target penerima dan jumlah penambahan hari cuti tahunan (default +12 hari per periode).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Kategori Karyawan */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Jenis Karyawan</Label>
                  <select
                    value={annualCategory}
                    onChange={(e) => setAnnualCategory(e.target.value)}
                    className="w-full h-9 rounded-full border border-slate-300 bg-white px-3 text-xs focus:border-[#0084c7] focus:outline-none"
                  >
                    <option value="ALL">Semua Jenis (Pimpinan & Pelaksana)</option>
                    <option value="PIMPINAN">Khusus Karyawan Pimpinan</option>
                    <option value="PELAKSANA">Khusus Karyawan Pelaksana</option>
                  </select>
                </div>

                {/* 2. Bagian */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Bagian / Unit Kerja</Label>
                  <select
                    value={annualDept}
                    onChange={(e) => setAnnualDept(e.target.value)}
                    className="w-full h-9 rounded-full border border-slate-300 bg-white px-3 text-xs focus:border-[#0084c7] focus:outline-none"
                  >
                    <option value="ALL">Semua Bagian</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Stasiun */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Stasiun</Label>
                  <select
                    value={annualStation}
                    onChange={(e) => setAnnualStation(e.target.value)}
                    className="w-full h-9 rounded-full border border-slate-300 bg-white px-3 text-xs focus:border-[#0084c7] focus:outline-none"
                  >
                    <option value="ALL">Semua Stasiun</option>
                    {stations.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.code} - {s.name} ({s.departmentName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* 4. Jumlah Hari */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Jumlah Kuota (Hari)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={36}
                    value={annualDays}
                    onChange={(e) => setAnnualDays(Number(e.target.value))}
                    className="h-9 text-xs rounded-full font-mono font-bold text-[#0084c7]"
                  />
                </div>

                {/* 5. Periode Tahun */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Periode Tahun</Label>
                  <Input
                    type="number"
                    value={annualYear}
                    onChange={(e) => setAnnualYear(Number(e.target.value))}
                    className="h-9 text-xs rounded-full font-mono font-bold"
                  />
                </div>

                {/* 6. Uraian Keterangan */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Keterangan / Uraian</Label>
                  <Input
                    type="text"
                    placeholder="Contoh: Pemberian Hak Cuti Tahunan 2026"
                    value={annualUraian}
                    onChange={(e) => setAnnualUraian(e.target.value)}
                    className="h-9 text-xs rounded-full"
                  />
                </div>
              </div>

              {/* Action Button: Pratinjau */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  onClick={handlePreviewAnnual}
                  disabled={isPending}
                  className="rounded-full gap-2 px-5 h-9 text-xs font-bold bg-[#0084c7] hover:bg-[#0077b6] text-white shadow-xs"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Lihat Pratinjau Karyawan (Dry Run)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pratinjau Hasil & Tombol Eksekusi */}
          {annualPreviewLoaded && (
            <Card className="border-sky-200/80 shadow-md">
              <CardHeader className="py-3.5 px-5 bg-gradient-to-r from-sky-50 via-white to-sky-50/20 border-b border-sky-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Hasil Pratinjau Dampak ({annualPreviewItems.length} Karyawan)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Periksa simulasi penambahan saldo sebelum mengeksekusi ke database.
                  </CardDescription>
                </div>

                {annualPreviewItems.length > 0 && (
                  <Button
                    onClick={() => {
                      setConfirmTarget("ANNUAL");
                      setIsConfirmModalOpen(true);
                    }}
                    disabled={isPending}
                    className="rounded-full px-5 h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Eksekusi Penambahan (+{annualDays} Hari)
                  </Button>
                )}
              </CardHeader>

              <CardContent className="p-0">
                {annualPreviewItems.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    Tidak ada karyawan yang sesuai dengan kriteria filter yang dipilih.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 text-[11px]">
                          <TableHead className="w-12 text-center font-bold">NO</TableHead>
                          <TableHead className="font-bold">NIP & NAMA</TableHead>
                          <TableHead className="font-bold">BAGIAN & STASIUN</TableHead>
                          <TableHead className="font-bold">JENIS</TableHead>
                          <TableHead className="text-center font-bold">SALDO SAAT INI</TableHead>
                          <TableHead className="text-center font-bold text-[#0084c7]">PENAMBAHAN</TableHead>
                          <TableHead className="text-center font-bold text-emerald-700">SALDO SETELAHNYA</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {annualPreviewItems.map((emp, idx) => (
                          <TableRow key={emp.id} className="hover:bg-sky-50/30">
                            <TableCell className="text-center text-xs font-mono text-slate-400">
                              {idx + 1}
                            </TableCell>
                            <TableCell>
                              <div className="font-bold text-xs text-slate-900">{emp.nama}</div>
                              <Badge variant="code" className="text-[10px] px-1.5 py-0 mt-0.5">
                                NIP: {emp.nip}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">
                              <span className="font-medium text-slate-800">{emp.bagian}</span>
                              <span className="text-[10px] text-slate-400 block">{emp.stasiun}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={emp.category === "PELAKSANA" ? "success" : "secondary"} className="text-[10px]">
                                {emp.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs font-bold text-slate-700">
                              {emp.currentAnnual} hr
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs font-bold text-[#0084c7]">
                              +{annualDays} hr
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs font-bold text-emerald-700 bg-emerald-50/40">
                              {emp.newAnnual} hr
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PEMBERIAN CUTI BESAR MASSAL                         */}
      {/* ======================================================== */}
      {activeTab === "LONG_LEAVE" && (
        <div className="space-y-6">
          <Card className="border-slate-200/85 shadow-2xs">
            <CardHeader className="py-3.5 px-5 bg-gradient-to-r from-indigo-50/50 via-slate-50/20 to-transparent border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Pemberian Hak Cuti Besar Massal
              </CardTitle>
              <CardDescription className="text-xs">
                Tambahkan kuota cuti besar (6 tahunan) untuk sekelompok karyawan yang memenuhi masa dinas.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Target Kategori</Label>
                  <select
                    value={longCategory}
                    onChange={(e) => setLongCategory(e.target.value)}
                    className="w-full h-9 rounded-full border border-slate-300 bg-white px-3 text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="ALL">Semua Jenis Karyawan</option>
                    <option value="PIMPINAN">Karyawan Pimpinan</option>
                    <option value="PELAKSANA">Karyawan Pelaksana</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Bagian</Label>
                  <select
                    value={longDept}
                    onChange={(e) => setLongDept(e.target.value)}
                    className="w-full h-9 rounded-full border border-slate-300 bg-white px-3 text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="ALL">Semua Bagian</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Kuota Cuti Besar (Hari)</Label>
                  <Input
                    type="number"
                    value={longDays}
                    onChange={(e) => setLongDays(Number(e.target.value))}
                    className="h-9 text-xs rounded-full font-mono font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Keterangan / Uraian Mutasi</Label>
                <Input
                  type="text"
                  placeholder="Contoh: Hak Cuti Besar Periode Dinas Ke-6 Tahun"
                  value={longUraian}
                  onChange={(e) => setLongUraian(e.target.value)}
                  className="h-9 text-xs rounded-full"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  onClick={handlePreviewLong}
                  disabled={isPending}
                  className="rounded-full gap-2 px-5 h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Pratinjau Penerima Cuti Besar
                </Button>
              </div>
            </CardContent>
          </Card>

          {longPreviewLoaded && (
            <Card className="border-indigo-200/80 shadow-md">
              <CardHeader className="py-3.5 px-5 bg-indigo-50/40 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Hasil Pratinjau ({longPreviewItems.length} Karyawan)
                </CardTitle>
                {longPreviewItems.length > 0 && (
                  <Button
                    onClick={() => {
                      setConfirmTarget("LONG_LEAVE");
                      setIsConfirmModalOpen(true);
                    }}
                    className="rounded-full px-5 h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Eksekusi Cuti Besar (+{longDays} Hari)
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0 max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 text-[11px]">
                      <TableHead className="w-12 text-center">NO</TableHead>
                      <TableHead>NIP & NAMA</TableHead>
                      <TableHead>BAGIAN</TableHead>
                      <TableHead className="text-center">CUTI BESAR AWAL</TableHead>
                      <TableHead className="text-center text-indigo-700">PENAMBAHAN</TableHead>
                      <TableHead className="text-center text-indigo-900 font-bold">TOTAL CUTI BESAR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {longPreviewItems.map((emp, idx) => (
                      <TableRow key={emp.id}>
                        <TableCell className="text-center font-mono text-xs text-slate-400">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="font-bold text-xs text-slate-900">{emp.nama}</div>
                          <Badge variant="code" className="text-[10px]">{emp.nip}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">{emp.bagian}</TableCell>
                        <TableCell className="text-center font-mono text-xs">{emp.currentLongLeave} hr</TableCell>
                        <TableCell className="text-center font-mono text-xs text-indigo-600 font-bold">+{longDays} hr</TableCell>
                        <TableCell className="text-center font-mono text-xs font-bold text-indigo-900 bg-indigo-50/50">
                          {emp.newLongLeave} hr
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PERGANTIAN PERIODE TAHUN (ROLL-FORWARD)             */}
      {/* ======================================================== */}
      {activeTab === "ROLL_FORWARD" && (
        <div className="space-y-6">
          <Card className="border-amber-200/90 shadow-2xs bg-gradient-to-br from-white via-white to-amber-50/20">
            <CardHeader className="py-3.5 px-5 border-b border-amber-100 bg-amber-50/50">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <RotateCw className="h-4 w-4 text-amber-700" />
                Pergantian Periode Tahun Saldo (Roll-Forward)
              </CardTitle>
              <CardDescription className="text-xs text-amber-900">
                Migrasi seluruh saldo aktif karyawan ke periode tahun kalender baru.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Tahun Periode Baru</Label>
                  <Input
                    type="number"
                    value={rollNewYear}
                    onChange={(e) => setRollNewYear(Number(e.target.value))}
                    className="h-9 text-xs rounded-full font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Default Kuota Tahunan Baru (Hari)</Label>
                  <Input
                    type="number"
                    value={rollDefaultAnnual}
                    onChange={(e) => setRollDefaultAnnual(Number(e.target.value))}
                    disabled={!rollResetAnnual}
                    className="h-9 text-xs rounded-full font-mono font-bold text-[#0084c7]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="resetAnnualCheck"
                  checked={rollResetAnnual}
                  onChange={(e) => setRollResetAnnual(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#0084c7] focus:ring-[#0084c7]"
                />
                <Label htmlFor="resetAnnualCheck" className="text-xs text-slate-700 cursor-pointer">
                  Reset kuota cuti tahunan ke standar baru ({rollDefaultAnnual} hari) untuk semua karyawan.
                </Label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  onClick={handlePreviewRoll}
                  disabled={isPending}
                  className="rounded-full gap-2 px-5 h-9 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  <Search className="h-4 w-4" />
                  Pratinjau Roll-Forward Periode
                </Button>
              </div>
            </CardContent>
          </Card>

          {rollPreviewLoaded && (
            <Card className="border-amber-200/80 shadow-md">
              <CardHeader className="py-3.5 px-5 bg-amber-50/40 border-b border-amber-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Pratinjau Roll-Forward ke Tahun {rollNewYear} ({rollPreviewItems.length} Karyawan)
                </CardTitle>
                <Button
                  onClick={() => {
                    setConfirmTarget("ROLL_FORWARD");
                    setIsConfirmModalOpen(true);
                  }}
                  className="rounded-full px-5 h-9 text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white"
                >
                  Eksekusi Roll-Forward {rollNewYear}
                </Button>
              </CardHeader>
              <CardContent className="p-0 max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 text-[11px]">
                      <TableHead className="w-12 text-center">NO</TableHead>
                      <TableHead>NIP & NAMA</TableHead>
                      <TableHead>BAGIAN</TableHead>
                      <TableHead className="text-center">SALDO TAHUNAN BARU</TableHead>
                      <TableHead className="text-center">CUTI BESAR (TETAP)</TableHead>
                      <TableHead className="text-center font-bold text-amber-900">TOTAL SALDO {rollNewYear}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rollPreviewItems.map((emp, idx) => (
                      <TableRow key={emp.id}>
                        <TableCell className="text-center font-mono text-xs text-slate-400">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="font-bold text-xs text-slate-900">{emp.nama}</div>
                          <Badge variant="code" className="text-[10px]">{emp.nip}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">{emp.bagian}</TableCell>
                        <TableCell className="text-center font-mono text-xs font-bold text-[#0084c7]">{emp.newAnnual} hr</TableCell>
                        <TableCell className="text-center font-mono text-xs">{emp.currentLongLeave} hr</TableCell>
                        <TableCell className="text-center font-mono text-xs font-bold text-amber-900 bg-amber-50/50">
                          {emp.newTotal} hr
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: RIWAYAT EKSEKUSI MASSAL                             */}
      {/* ======================================================== */}
      {activeTab === "HISTORY" && (
        <Card className="border-slate-200/85 shadow-2xs">
          <CardHeader className="py-3.5 px-5 bg-gradient-to-r from-slate-50 via-white to-transparent border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#0084c7]" />
                Riwayat Log Eksekusi Proses Massal
              </CardTitle>
              <CardDescription className="text-xs">
                Catatan riwayat pemberian kuota dan pergantian periode massal yang telah dijalankan.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadHistory}
              disabled={isLoadingHistory}
              className="rounded-full h-8 px-3 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingHistory ? "animate-spin" : ""}`} />
              Segarkan
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center p-12 gap-2 text-xs text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#0084c7]" />
                Memuat riwayat proses massal...
              </div>
            ) : historyItems.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">Belum Ada Riwayat Proses Massal</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Seluruh eksekusi penambahan cuti massal atau roll-forward akan otomatis tercatat di tabel log ini.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 text-[11px]">
                    <TableHead className="w-36 font-bold">WAKTU EKSEKUSI</TableHead>
                    <TableHead className="font-bold">JENIS PROSES</TableHead>
                    <TableHead className="font-bold">URAIAN / KETERANGAN</TableHead>
                    <TableHead className="text-center font-bold">JUMLAH KARYAWAN</TableHead>
                    <TableHead className="text-right font-bold">JUMLAH HARI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/60">
                      <TableCell className="font-mono text-xs text-slate-600">
                        {formatDateIndo(new Date(item.tglTransaksi))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {item.jenisProses}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-800 font-medium max-w-xs truncate">
                        {item.uraian}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-bold text-slate-900">
                        {item.jumlahKaryawan} orang
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-[#0084c7]">
                        +{item.totalHariPerKaryawan} hari
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal Dialog Konfirmasi Keamanan */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent onClose={() => setIsConfirmModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-2">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <DialogTitle className="text-base font-bold text-center text-slate-900">
              Konfirmasi Eksekusi Proses Massal
            </DialogTitle>
            <DialogDescription className="text-xs text-center text-slate-600">
              Apakah Anda yakin ingin mengeksekusi proses ini? Perubahan saldo cuti akan otomatis diperbarui dan dicatat ke ledger transaksi mutasi karyawan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmModalOpen(false)}
              className="rounded-full text-xs"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteConfirmed}
              disabled={isPending}
              className="rounded-full text-xs font-bold bg-[#0084c7] hover:bg-[#0077b6] text-white"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Ya, Eksekusi Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
