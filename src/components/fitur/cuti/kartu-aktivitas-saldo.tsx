"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Printer,
  History,
  Pencil,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiDatePicker } from "@/components/bersama/pemilih-tanggal";
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
  correctLeaveRequestAction,
  EmployeeLeaveHistoryItem,
} from "@/actions/aksi-cuti";
import { formatDateIndo } from "@/lib/utils";

export interface EmployeeInfo {
  id: string;
  employeeNumber: string;
  name: string;
  position?: string;
  category?: string;
  stasiun?: string;
  department: {
    name: string;
  };
  balances: {
    annual: number;
    longLeave: number;
    inhaldagen: number;
    total: number;
  };
}

interface BalanceActivityCardProps {
  employee: EmployeeInfo;
  history: EmployeeLeaveHistoryItem[];
  isLoading?: boolean;
  onRefreshHistory: (employeeId: string) => void;
  onEmployeeBalancesUpdated: (updatedBalances: {
    annual: number;
    longLeave: number;
    inhaldagen: number;
    total: number;
  }) => void;
  actionButton?: React.ReactNode;
}

function parseDatesToIso(datesList?: string[]): string[] {
  if (!datesList || datesList.length === 0) return [];
  return datesList.map((str) => {
    if (str.includes("/")) {
      const parts = str.split("/");
      if (parts.length === 3) {
        const [day, m, y] = parts;
        return `${y}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
    return str;
  });
}

export function BalanceActivityCard({
  employee,
  history,
  isLoading = false,
  onRefreshHistory,
  onEmployeeBalancesUpdated,
  actionButton,
}: BalanceActivityCardProps) {
  const isPelaksana = employee.category?.toUpperCase() === "PELAKSANA";

  // Table Sorting States (Default: ASC / Dari yang terlama ke terbaru)
  type SortField = "no" | "date" | "uraian" | "dates" | "annual" | "longLeave" | "inhaldagen";
  type SortOrder = "asc" | "desc";

  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      let comparison = 0;
      if (sortField === "date" || sortField === "no") {
        const dateA = new Date(a.requestDate).getTime();
        const dateB = new Date(b.requestDate).getTime();
        comparison = dateA - dateB;
      } else if (sortField === "uraian") {
        const textA = (a.uraian || "").toLowerCase();
        const textB = (b.uraian || "").toLowerCase();
        comparison = textA.localeCompare(textB);
      } else if (sortField === "dates") {
        const datesA = a.selectedDates?.length || 0;
        const datesB = b.selectedDates?.length || 0;
        comparison = datesA - datesB;
      } else if (sortField === "annual") {
        comparison = (a.annualDays || 0) - (b.annualDays || 0);
      } else if (sortField === "longLeave") {
        comparison = (a.longLeaveDays || 0) - (b.longLeaveDays || 0);
      } else if (sortField === "inhaldagen") {
        comparison = (a.inhaldagenDays || 0) - (b.inhaldagenDays || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [history, sortField, sortOrder]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400 group-hover:text-slate-700 transition-colors" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3 text-[#0093dc] font-bold" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#0093dc] font-bold" />
    );
  };

  // Edit / Koreksi Cuti Modal States
  const [editingLeaveItem, setEditingLeaveItem] = useState<EmployeeLeaveHistoryItem | null>(null);
  const [editRequestDate, setEditRequestDate] = useState<string>("");
  const [editSelectedDates, setEditSelectedDates] = useState<string[]>([]);
  const [editAnnualDays, setEditAnnualDays] = useState<number>(0);
  const [editLongLeaveDays, setEditLongLeaveDays] = useState<number>(0);
  const [editInhaldagenDays, setEditInhaldagenDays] = useState<number>(0);
  const [editPurpose, setEditPurpose] = useState<string>("");
  const [isPendingEdit, startTransitionEdit] = useTransition();

  // Print Dialog States
  const [printingLetterItem, setPrintingLetterItem] = useState<EmployeeLeaveHistoryItem | null>(null);
  const [isPrintingHistoryModalOpen, setIsPrintingHistoryModalOpen] = useState(false);

  // Calculation for requested days & balances in Edit Modal
  const editMaxAnnual = (employee.balances.annual ?? 0) + (editingLeaveItem?.annualDays ?? 0);
  const editMaxLongLeave = (employee.balances.longLeave ?? 0) + (editingLeaveItem?.longLeaveDays ?? 0);
  const editMaxInhaldagen = isPelaksana ? 0 : (employee.balances.inhaldagen ?? 0) + (editingLeaveItem?.inhaldagenDays ?? 0);

  const editTotalAllocated =
    Number(editAnnualDays || 0) + Number(editLongLeaveDays || 0) + (isPelaksana ? 0 : Number(editInhaldagenDays || 0));

  const editRemainingAnnual = editMaxAnnual - (Number(editAnnualDays) || 0);
  const editRemainingLongLeave = editMaxLongLeave - (Number(editLongLeaveDays) || 0);
  const editRemainingInhaldagen = isPelaksana ? 0 : editMaxInhaldagen - (Number(editInhaldagenDays) || 0);

  const isEditExceedingAnnual = editRemainingAnnual < 0;
  const isEditExceedingLongLeave = editRemainingLongLeave < 0;
  const isEditExceedingInhaldagen = !isPelaksana && editRemainingInhaldagen < 0;
  const hasInvalidEditAllocation =
    isEditExceedingAnnual || isEditExceedingLongLeave || isEditExceedingInhaldagen;

  const isEditAllocationMismatch =
    editSelectedDates.length > 0 && editTotalAllocated !== editSelectedDates.length;

  const handleOpenEditModal = (item: EmployeeLeaveHistoryItem) => {
    setEditingLeaveItem(item);
    const reqDate = item.requestDate ? item.requestDate.split("T")[0] : new Date().toISOString().split("T")[0];
    setEditRequestDate(reqDate);
    setEditSelectedDates(parseDatesToIso(item.selectedDates));
    setEditAnnualDays(item.annualDays || 0);
    setEditLongLeaveDays(item.longLeaveDays || 0);
    setEditInhaldagenDays(isPelaksana ? 0 : item.inhaldagenDays || 0);
    setEditPurpose(item.purpose && item.purpose !== "-" ? item.purpose : "");
  };

  const handleEditDatesChange = (dates: string[]) => {
    setEditSelectedDates(dates);
    const count = dates.length;
    if (count === 0) {
      setEditAnnualDays(0);
      setEditLongLeaveDays(0);
      setEditInhaldagenDays(0);
      return;
    }
    if (isPelaksana) {
      if (editAnnualDays > 0 && editLongLeaveDays === 0) {
        setEditAnnualDays(Math.min(count, editMaxAnnual));
      } else if (editLongLeaveDays > 0 && editAnnualDays === 0) {
        setEditLongLeaveDays(Math.min(count, editMaxLongLeave));
      }
      setEditInhaldagenDays(0);
      return;
    }
    if (editAnnualDays > 0 && editLongLeaveDays === 0 && editInhaldagenDays === 0) {
      setEditAnnualDays(Math.min(count, editMaxAnnual));
    } else if (editLongLeaveDays > 0 && editAnnualDays === 0 && editInhaldagenDays === 0) {
      setEditLongLeaveDays(Math.min(count, editMaxLongLeave));
    } else if (editInhaldagenDays > 0 && editAnnualDays === 0 && editLongLeaveDays === 0) {
      setEditInhaldagenDays(Math.min(count, editMaxInhaldagen));
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeaveItem) return;

    if (editSelectedDates.length === 0) {
      toast.error("Silakan pilih minimal 1 tanggal cuti di kalender.");
      return;
    }

    if (isEditAllocationMismatch) {
      toast.error(
        `Total alokasi (${editTotalAllocated} hari) tidak sama dengan jumlah tanggal yang dipilih (${editSelectedDates.length} hari).`
      );
      return;
    }

    if (hasInvalidEditAllocation) {
      toast.error("Alokasi cuti melebihi saldo yang tersedia!");
      return;
    }

    if (!editPurpose.trim()) {
      toast.error("Mohon isi alasan / keperluan cuti.");
      return;
    }

    startTransitionEdit(async () => {
      const res = await correctLeaveRequestAction({
        activityId: editingLeaveItem.id,
        employeeId: employee.id,
        requestDate: editRequestDate,
        selectedDates: editSelectedDates,
        startDate: editSelectedDates[0],
        endDate: editSelectedDates[editSelectedDates.length - 1],
        annualDays: Number(editAnnualDays) || 0,
        longLeaveDays: Number(editLongLeaveDays) || 0,
        inhaldagenDays: Number(editInhaldagenDays) || 0,
        purpose: editPurpose,
      });

      if (res.success && res.data) {
        toast.success(res.message || "Koreksi permohonan cuti berhasil disimpan!");
        setEditingLeaveItem(null);
        onEmployeeBalancesUpdated(res.data.updatedBalances);
        onRefreshHistory(employee.id);
      } else {
        toast.error(res.message || "Gagal menyimpan koreksi permohonan cuti.");
      }
    });
  };

  return (
    <>
      <Card className="border-slate-200/80 bg-white shadow-xs rounded-xl overflow-hidden transition-all duration-200">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-slate-600 shrink-0" />
                <CardTitle className="text-sm sm:text-base font-semibold text-slate-800">
                  Riwayat Aktivitas Saldo — <span className="font-bold text-slate-900">{employee.name}</span>
                </CardTitle>
                <Badge variant="outline" className="text-[11px] font-mono bg-white border-slate-200 text-slate-600 px-2 py-0.5">
                  {history.length} Data
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Catatan mutasi penambahan dan penggunaan saldo cuti karyawan
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {actionButton}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPrintingHistoryModalOpen(true)}
                disabled={history.length === 0}
                className="gap-1.5 h-8 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
                title="Cetak Rekap Riwayat Cuti"
              >
                <Printer className="h-3.5 w-3.5 text-slate-500" />
                Cetak Rekap
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
              <span className="text-xs">Memuat riwayat aktivitas...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <History className="h-8 w-8 mx-auto stroke-1 text-slate-300" />
              <p className="text-xs font-medium text-slate-500">Belum ada riwayat aktivitas saldo untuk karyawan ini.</p>
              <p className="text-[11px] text-slate-400">Gunakan tombol di atas untuk mengajukan cuti atau menambah saldo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/70 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent text-[11px] text-slate-600 uppercase tracking-wider font-semibold">
                    <TableHead
                      className="text-center w-12 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleSort("no")}
                      title="Urutkan No"
                    >
                      <div className="inline-flex items-center justify-center gap-1">
                        <span>No</span>
                        {renderSortIcon("no")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-center w-32 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleSort("date")}
                      title="Urutkan Tanggal Permohonan"
                    >
                      <div className="inline-flex items-center justify-center gap-1">
                        <span>Tgl Transaksi</span>
                        {renderSortIcon("date")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleSort("uraian")}
                      title="Urutkan Uraian"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Uraian</span>
                        {renderSortIcon("uraian")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleSort("dates")}
                      title="Urutkan Tanggal Cuti"
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>Tanggal Cuti</span>
                        {renderSortIcon("dates")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-center w-28 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleSort("annual")}
                      title="Urutkan Cuti Tahunan"
                    >
                      <div className="inline-flex items-center justify-center gap-1">
                        <span>Tahunan</span>
                        {renderSortIcon("annual")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-center w-28 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      onClick={() => handleSort("longLeave")}
                      title="Urutkan Cuti Besar"
                    >
                      <div className="inline-flex items-center justify-center gap-1">
                        <span>Besar</span>
                        {renderSortIcon("longLeave")}
                      </div>
                    </TableHead>
                    {!isPelaksana && (
                      <TableHead
                        className="text-center w-28 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                        onClick={() => handleSort("inhaldagen")}
                        title="Urutkan Inhaldagen"
                      >
                        <div className="inline-flex items-center justify-center gap-1">
                          <span>Inhaldagen</span>
                          {renderSortIcon("inhaldagen")}
                        </div>
                      </TableHead>
                    )}
                    <TableHead className="text-center min-w-[190px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 text-xs">
                  {sortedHistory.map((item, idx) => {
                    const isTambah = item.transactionType === "TAMBAH_SALDO";

                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <TableCell className="text-center font-mono text-slate-400 font-medium">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="text-center font-mono text-slate-700">
                          {formatDateIndo(item.requestDate)}
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">
                          {item.uraian || (isTambah ? "Penambahan Saldo" : "Pengambilan Cuti")}
                        </TableCell>
                        <TableCell>
                          {isTambah ? (
                            <span className="text-slate-300 font-mono">-</span>
                          ) : (
                            <span className="font-mono text-slate-700 text-xs">
                              {item.selectedDates && item.selectedDates.length > 0
                                ? item.selectedDates.join(", ")
                                : `${formatDateIndo(item.startDate)} s/d ${formatDateIndo(item.endDate)}`}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.annualDays > 0 ? (
                            isTambah ? (
                              <span className="font-mono font-bold text-emerald-600">+{item.annualDays}</span>
                            ) : (
                              <span className="font-mono font-bold text-red-600">-{item.annualDays}</span>
                            )
                          ) : (
                            <span className="text-slate-300 font-mono">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.longLeaveDays > 0 ? (
                            isTambah ? (
                              <span className="font-mono font-bold text-emerald-600">+{item.longLeaveDays}</span>
                            ) : (
                              <span className="font-mono font-bold text-red-600">-{item.longLeaveDays}</span>
                            )
                          ) : (
                            <span className="text-slate-300 font-mono">-</span>
                          )}
                        </TableCell>
                        {!isPelaksana && (
                          <TableCell className="text-center">
                            {item.inhaldagenDays > 0 ? (
                              isTambah ? (
                                <span className="font-mono font-bold text-emerald-600">+{item.inhaldagenDays}</span>
                              ) : (
                                <span className="font-mono font-bold text-red-600">-{item.inhaldagenDays}</span>
                              )
                            ) : (
                              <span className="text-slate-300 font-mono">-</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          {isTambah ? (
                            <span className="text-slate-300 font-mono">-</span>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditModal(item)}
                                className="gap-1 h-7 text-[11px] font-medium text-amber-700 bg-amber-50/60 hover:bg-amber-100/80 border-amber-200"
                                title="Koreksi Permohonan Cuti"
                              >
                                <Pencil className="h-3 w-3 text-amber-600" />
                                Koreksi
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPrintingLetterItem(item)}
                                className="gap-1.5 h-7 text-[11px] font-medium text-blue-700 bg-blue-50/60 hover:bg-blue-100/80 border-blue-200"
                                title="Cetak Surat Izin Cuti"
                              >
                                <Printer className="h-3 w-3 text-blue-600" />
                                Cetak Surat Cuti
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* POPUP MODAL: KOREKSI / EDIT PERMOHONAN CUTI */}
      <Dialog open={!!editingLeaveItem} onOpenChange={(open) => !open && setEditingLeaveItem(null)}>
        <DialogContent onClose={() => setEditingLeaveItem(null)} className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base font-bold text-slate-900">
              <span className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-amber-600" />
                Koreksi Permohonan Cuti
              </span>
              <Badge variant="secondary" className="font-mono text-xs font-semibold">
                {employee.employeeNumber} - {employee.name}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Ubah tanggal cuti yang diambil atau sesuaikan alokasi saldo. Perubahan hari akan otomatis menyesuaikan saldo karyawan.
            </DialogDescription>
          </DialogHeader>

          {editingLeaveItem && (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-1">
              {/* Info Saldo Tersedia untuk Koreksi */}
              <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-lg flex items-center justify-between text-xs">
                <span className="font-medium text-amber-900">
                  Batas Saldo Maksimal untuk Koreksi Ini:
                </span>
                <span className="font-mono font-bold text-amber-950">
                  Tahunan: {editMaxAnnual} hr | Besar: {editMaxLongLeave} hr | Inhaldagen: {editMaxInhaldagen} hr
                </span>
              </div>

              {/* Tanggal Permohonan */}
              <div className="space-y-1">
                <Label htmlFor="editRequestDate" required className="text-xs font-semibold text-slate-700">
                  Tanggal Permohonan Cuti:
                </Label>
                <Input
                  id="editRequestDate"
                  type="date"
                  value={editRequestDate}
                  onChange={(e) => setEditRequestDate(e.target.value)}
                  disabled={isPendingEdit}
                  required
                  className="h-9 text-xs font-medium"
                />
              </div>

              {/* Kalender Multi Date Picker */}
              <div className="space-y-1.5">
                <Label required className="text-xs font-semibold text-slate-700">
                  Pilih Tanggal Cuti di Kalender (Klik tanggal untuk menambah / membatalkan):
                </Label>
                <MultiDatePicker
                  selectedDates={editSelectedDates}
                  onChange={handleEditDatesChange}
                  disabled={isPendingEdit}
                />
              </div>

              {/* Alokasi Jumlah Hari per Jenis Cuti */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Alokasi Hari per Jenis Cuti:
                  </Label>
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                    <span>
                      Total Dipilih:{" "}
                      <span className="font-mono text-xs font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {editSelectedDates.length} hari
                      </span>
                    </span>
                    <span>
                      Total Alokasi:{" "}
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${isEditAllocationMismatch ? "bg-red-50 text-red-600 border-red-300" : "bg-white text-emerald-700 border-slate-200"}`}>
                        {editTotalAllocated} hari
                      </span>
                    </span>
                  </div>
                </div>

                {isEditAllocationMismatch && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                      Total alokasi ({editTotalAllocated} hari) belum cocok dengan {editSelectedDates.length} tanggal yang dipilih di kalender. Sesuaikan jumlah hari di bawah.
                    </span>
                  </div>
                )}

                <div className={`grid grid-cols-1 ${isPelaksana ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-3`}>
                  {/* Tahunan Input */}
                  <div className="space-y-1 bg-white p-2.5 rounded-md border border-slate-200">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-blue-900">Cuti Tahunan</span>
                      <span className="text-slate-400 font-mono">
                        Maks: {editMaxAnnual}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max={editMaxAnnual}
                        value={editAnnualDays || ""}
                        placeholder="0"
                        onChange={(e) => setEditAnnualDays(Number(e.target.value) || 0)}
                        disabled={isPendingEdit}
                        className={`h-8 text-xs pr-10 font-semibold ${isEditExceedingAnnual ? "border-red-500" : ""}`}
                      />
                      <span className="absolute right-2.5 top-2 text-[11px] text-slate-400">hari</span>
                    </div>
                    {isEditExceedingAnnual && (
                      <p className="text-[10px] text-red-600 font-medium">Melebihi batas!</p>
                    )}
                  </div>

                  {/* Cuti Besar Input */}
                  <div className="space-y-1 bg-white p-2.5 rounded-md border border-slate-200">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-purple-900">Cuti Besar</span>
                      <span className="text-slate-400 font-mono">
                        Maks: {editMaxLongLeave}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max={editMaxLongLeave}
                        value={editLongLeaveDays || ""}
                        placeholder="0"
                        onChange={(e) => setEditLongLeaveDays(Number(e.target.value) || 0)}
                        disabled={isPendingEdit}
                        className={`h-8 text-xs pr-10 font-semibold ${isEditExceedingLongLeave ? "border-red-500" : ""}`}
                      />
                      <span className="absolute right-2.5 top-2 text-[11px] text-slate-400">hari</span>
                    </div>
                    {isEditExceedingLongLeave && (
                      <p className="text-[10px] text-red-600 font-medium">Melebihi batas!</p>
                    )}
                  </div>

                  {/* Inhaldagen Input (HANYA UNTUK KARYAWAN PIMPINAN) */}
                  {!isPelaksana && (
                    <div className="space-y-1 bg-white p-2.5 rounded-md border border-slate-200">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-emerald-900">Inhaldagen</span>
                        <span className="text-slate-400 font-mono">
                          Maks: {editMaxInhaldagen}
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max={editMaxInhaldagen}
                          value={editInhaldagenDays || ""}
                          placeholder="0"
                          onChange={(e) => setEditInhaldagenDays(Number(e.target.value) || 0)}
                          disabled={isPendingEdit}
                          className={`h-8 text-xs pr-10 font-semibold ${isEditExceedingInhaldagen ? "border-red-500" : ""}`}
                        />
                        <span className="absolute right-2.5 top-2 text-[11px] text-slate-400">hari</span>
                      </div>
                      {isEditExceedingInhaldagen && (
                        <p className="text-[10px] text-red-600 font-medium">Melebihi batas!</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Keperluan / Alasan Cuti */}
              <div className="space-y-1">
                <Label htmlFor="editPurpose" required className="text-xs font-semibold text-slate-700">
                  Keperluan / Alasan Cuti
                </Label>
                <textarea
                  id="editPurpose"
                  rows={2}
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                  placeholder="Contoh: Keperluan keluarga di luar kota"
                  disabled={isPendingEdit}
                  required
                  className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingLeaveItem(null)}
                  disabled={isPendingEdit}
                  className="h-9 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isPendingEdit ||
                    hasInvalidEditAllocation ||
                    isEditAllocationMismatch ||
                    editTotalAllocated <= 0 ||
                    editSelectedDates.length === 0
                  }
                  className="h-9 text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isPendingEdit ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Menyimpan Koreksi...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Simpan Perubahan Cuti
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* POPUP MODAL: CETAK SURAT IZIN CUTI */}
      <Dialog open={!!printingLetterItem} onOpenChange={(open) => !open && setPrintingLetterItem(null)}>
        <DialogContent onClose={() => setPrintingLetterItem(null)} className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base font-bold text-slate-900">
              <span className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-blue-600" />
                Cetak Surat Izin Cuti Karyawan
              </span>
              <Badge variant="outline" className="font-mono text-xs">
                {employee.employeeNumber}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Format standar cetak Surat Izin Cuti PG Trangkil Pati
            </DialogDescription>
          </DialogHeader>

          {printingLetterItem && (
            <div className="space-y-4 pt-2">
              <div
                id="printable-leave-letter"
                className="border border-slate-300 bg-white p-8 rounded-lg text-slate-900 font-serif text-sm shadow-2xs space-y-6"
              >
                {/* KOP SURAT RESMI */}
                <div className="text-center border-b-2 border-slate-900 pb-3 space-y-1">
                  <h2 className="font-bold text-base tracking-wider uppercase text-slate-900">
                    PT PERKEBUNAN NUSANTARA
                  </h2>
                  <h3 className="font-extrabold text-lg uppercase tracking-widest text-slate-900">
                    PABRIK GULA TRANGKIL
                  </h3>
                  <p className="text-xs font-sans text-slate-600">
                    Jl. Raya Trangkil No. 1, Pati, Jawa Tengah — Telp: (0295) 381234
                  </p>
                </div>

                {/* JUDUL SURAT */}
                <div className="text-center space-y-1">
                  <h4 className="font-bold text-base underline uppercase tracking-wide">
                    SURAT IZIN PENGAMBILAN CUTI
                  </h4>
                </div>

                {/* ISI SURAT */}
                <div className="space-y-3 font-sans text-xs text-slate-800 leading-relaxed">
                  <p>Yang bertanda tangan di bawah ini menerangkan bahwa:</p>
                  <div className="grid grid-cols-[140px_10px_1fr] gap-y-1.5 pl-4">
                    <span className="font-medium text-slate-600">Nama</span>
                    <span>:</span>
                    <strong className="text-slate-900">{employee.name}</strong>

                    <span className="font-medium text-slate-600">NIP</span>
                    <span>:</span>
                    <span className="font-mono">{employee.employeeNumber}</span>

                    <span className="font-medium text-slate-600">Bagian</span>
                    <span>:</span>
                    <span>{employee.department.name}</span>

                    <span className="font-medium text-slate-600">Jabatan / Stasiun</span>
                    <span>:</span>
                    <span>{employee.position || "-"} ({employee.stasiun || "Umum"})</span>
                  </div>

                  <p className="pt-2">
                    Diberikan izin untuk melaksanakan <strong>{printingLetterItem.uraian || "Cuti"}</strong> selama{" "}
                    <strong>{printingLetterItem.totalDays} Hari Kerja</strong> pada tanggal:
                  </p>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded font-mono text-xs font-bold text-blue-900 pl-4">
                    {printingLetterItem.selectedDates && printingLetterItem.selectedDates.length > 0
                      ? printingLetterItem.selectedDates.join(", ")
                      : `${formatDateIndo(printingLetterItem.startDate)} s/d ${formatDateIndo(printingLetterItem.endDate)}`}
                  </div>

                  <div className="grid grid-cols-[140px_10px_1fr] gap-y-1 pl-4 pt-1">
                    <span className="font-medium text-slate-600">Alasan / Keperluan</span>
                    <span>:</span>
                    <span>{printingLetterItem.purpose || "-"}</span>

                    <span className="font-medium text-slate-600">Rincian Saldo Terpakai</span>
                    <span>:</span>
                    <span>
                      Tahunan: {printingLetterItem.annualDays} hr | Besar: {printingLetterItem.longLeaveDays} hr {!isPelaksana && `| Inhaldagen: ${printingLetterItem.inhaldagenDays} hr`}
                    </span>
                  </div>

                  <p className="pt-2">
                    Demikian surat izin cuti ini diberikan untuk dapat dipergunakan sebagaimana mestinya.
                  </p>
                </div>

                {/* TANDA TANGAN */}
                <div className="grid grid-cols-2 gap-8 pt-8 text-center font-sans text-xs">
                  <div>
                    <p className="text-slate-600">Pemohon Cuti,</p>
                    <div className="h-16"></div>
                    <p className="font-bold text-slate-900 underline">{employee.name}</p>
                    <p className="text-slate-500 font-mono">NIP. {employee.employeeNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Pati, {formatDateIndo(new Date().toISOString())}</p>
                    <p className="text-slate-600 font-medium">Kepala Bagian SDM & Umum,</p>
                    <div className="h-16"></div>
                    <p className="font-bold text-slate-900 underline">( ............................................ )</p>
                    <p className="text-slate-500 font-mono">NIP. ....................................</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPrintingLetterItem(null)}
            >
              Tutup
            </Button>
            <Button
              type="button"
              onClick={() => window.print()}
              className="font-semibold gap-1.5"
            >
              <Printer className="h-4 w-4" />
              Cetak / Simpan PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* POPUP MODAL: CETAK LEMBAR REKAP AKTIVITAS SALDO PEGAWAI */}
      <Dialog open={isPrintingHistoryModalOpen} onOpenChange={setIsPrintingHistoryModalOpen}>
        <DialogContent onClose={() => setIsPrintingHistoryModalOpen(false)} className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base font-bold text-slate-900">
              <span className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-blue-600" />
                Cetak Lembar Aktivitas Saldo Cuti Karyawan
              </span>
            </DialogTitle>
            <DialogDescription>
              Format Kartu Riwayat Mutasi Saldo & Pengambilan Cuti Pegawai PT Perkebunan Nusantara — PG Trangkil
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div id="printable-history-sheet" className="border border-slate-300 bg-white p-6 rounded-lg text-slate-900 text-xs shadow-2xs font-sans space-y-4">
              {/* Kop Surat */}
              <div className="border-b-2 border-slate-800 pb-3 text-center space-y-0.5">
                <h2 className="text-sm font-black tracking-widest text-slate-900 uppercase">
                  PT PERKEBUNAN NUSANTARA
                </h2>
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">
                  PABRIK GULA TRANGKIL PATI
                </h3>
                <p className="text-[10px] text-slate-600 font-medium">
                  KARTU / BUKU HISTORI AKTIVITAS SALDO CUTI KARYAWAN {isPelaksana ? "PELAKSANA" : "PIMPINAN"}
                </p>
              </div>

              {/* Info Pegawai */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Nama Karyawan:</span>
                  <strong className="text-slate-900 text-sm">{employee.name}</strong>
                  <span className="text-slate-500 block text-[11px] font-mono mt-1">NIP: {employee.employeeNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Bagian & Stasiun:</span>
                  <strong className="text-slate-900">{employee.department.name}</strong>
                  <span className="text-slate-600 block text-[11px]">Stasiun: {employee.stasiun || "-"}</span>
                </div>
              </div>

              {/* Tabel Histori */}
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="border border-slate-300 p-2 text-center w-10">No</th>
                    <th className="border border-slate-300 p-2 text-center w-28">Tgl Transaksi</th>
                    <th className="border border-slate-300 p-2 text-left">Uraian</th>
                    <th className="border border-slate-300 p-2 text-left">Tanggal Cuti</th>
                    <th className="border border-slate-300 p-2 text-center w-20">Tahunan</th>
                    <th className="border border-slate-300 p-2 text-center w-20">Besar</th>
                    {!isPelaksana && (
                      <th className="border border-slate-300 p-2 text-center w-20">Inhaldagen</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedHistory.map((h, i) => {
                    const isTambah = h.transactionType === "TAMBAH_SALDO";
                    return (
                      <tr key={h.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="p-2 text-center font-mono">{i + 1}</td>
                        <td className="p-2 text-center font-mono">{formatDateIndo(h.requestDate)}</td>
                        <td className="p-2 font-medium">{h.uraian || (isTambah ? "Penambahan Saldo" : "Pengambilan Cuti")}</td>
                        <td className="p-2 font-mono">
                          {isTambah ? "-" : (h.selectedDates && h.selectedDates.length > 0 ? h.selectedDates.join(", ") : `${formatDateIndo(h.startDate)} s/d ${formatDateIndo(h.endDate)}`)}
                        </td>
                        <td className="p-2 text-center font-mono font-bold">
                          {h.annualDays > 0 ? (
                            isTambah ? <span className="text-emerald-700">+{h.annualDays}</span> : <span className="text-red-600">-{h.annualDays}</span>
                          ) : <span className="text-slate-400 font-normal">-</span>}
                        </td>
                        <td className="p-2 text-center font-mono font-bold">
                          {h.longLeaveDays > 0 ? (
                            isTambah ? <span className="text-emerald-700">+{h.longLeaveDays}</span> : <span className="text-red-600">-{h.longLeaveDays}</span>
                          ) : <span className="text-slate-400 font-normal">-</span>}
                        </td>
                        {!isPelaksana && (
                          <td className="p-2 text-center font-mono font-bold">
                            {h.inhaldagenDays > 0 ? (
                              isTambah ? <span className="text-emerald-700">+{h.inhaldagenDays}</span> : <span className="text-red-600">-{h.inhaldagenDays}</span>
                            ) : <span className="text-slate-400 font-normal">-</span>}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Sisa Saldo Terkini */}
              <div className="text-right text-xs pt-1">
                <span className="font-semibold text-slate-800">
                  Total Sisa Saldo Cuti Saat Ini: <strong className="font-mono text-blue-900">{employee.balances.total} Hari</strong> (Tahunan: {employee.balances.annual} hr, Besar: {employee.balances.longLeave} hr{!isPelaksana ? `, Inhaldagen: ${employee.balances.inhaldagen} hr` : ""})
                </span>
              </div>

              {/* Sign-off */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div>
                  <p className="text-slate-600">Dicetak Oleh (Operator Cuti),</p>
                  <div className="h-14"></div>
                  <p className="font-bold text-slate-900 underline">( ............................................ )</p>
                </div>
                <div>
                  <p className="text-slate-600">Mengetahui, Kepala Bagian SDM & Umum</p>
                  <div className="h-14"></div>
                  <p className="font-bold text-slate-900 underline">( ............................................ )</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPrintingHistoryModalOpen(false)}
            >
              Tutup
            </Button>
            <Button
              type="button"
              onClick={() => window.print()}
              className="font-semibold gap-1.5"
            >
              <Printer className="h-4 w-4" />
              Cetak / Simpan PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { BalanceActivityCard as KartuAktivitasSaldo };

