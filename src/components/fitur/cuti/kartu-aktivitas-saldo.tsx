"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  Printer,
  History,
  Pencil,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarDays,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiDatePicker } from "@/components/bersama/pemilih-tanggal";
import { StepperHari } from "@/components/bersama/stepper-hari";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { AnimatedNumber } from "@/components/motion/animated-number";
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
import { voidLeaveRequestAction } from "@/actions/aksi-koreksi";
import { getCompanyProfileAction, getSignatoriesAction } from "@/actions/aksi-pengaturan";
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

  const [companyProfile, setCompanyProfile] = useState<{
    companyName: string;
    unitName: string;
    location: string;
    hrManagerName: string;
    hrManagerNip: string;
    hrManagerTitle: string;
    currentUserName: string;
  }>({
    companyName: "PT KEBON AGUNG",
    unitName: "PABRIK GULA TRANGKIL",
    location: "Trangkil, Pati, Jawa Tengah",
    hrManagerName: "Hendra Wijaya, S.E.",
    hrManagerNip: "198503152010011002",
    hrManagerTitle: "Kepala Bagian SDM & Umum",
    currentUserName: "Administrator",
  });

  // Helper parser data penandatanganan dari database tabel penandatanganan
  const parseSignatoriesData = (resData: NonNullable<Awaited<ReturnType<typeof getSignatoriesAction>>["data"]>) => {
    const heads: Record<string, { nama: string; jabatan: string }> = {};

    // 1. Inisialisasi awal dari data bagian departmentSignatories
    resData.departmentSignatories?.forEach((d) => {
      const entry = {
        nama: d.namaPimpinan || "",
        jabatan: d.jabatanPimpinan || `Kepala Bagian ${d.name}`,
      };
      if (d.id) heads[d.id.toLowerCase().trim()] = entry;
      if (d.code) heads[d.code.toLowerCase().trim()] = entry;
      if (d.name) heads[d.name.toLowerCase().trim()] = entry;
    });

    // 2. Timpa dengan data resmi tabel penandatanganan (kategori BAGIAN) yang diinput pengguna
    resData.signatories?.forEach((s) => {
      const entry = {
        nama: s.nama,
        jabatan: s.jabatan || `Kepala Bagian ${s.departmentName}`,
      };
      if (s.departmentId) {
        heads[s.departmentId] = entry;
        heads[s.departmentId.toLowerCase().trim()] = entry;
      }
      if (s.departmentCode) {
        heads[s.departmentCode] = entry;
        heads[s.departmentCode.toLowerCase().trim()] = entry;
      }
      if (s.departmentName) {
        const lowName = s.departmentName.toLowerCase().trim();
        heads[lowName] = entry;
        const upper = s.departmentName.toUpperCase();
        if (upper.includes("TATA USAHA") || upper.includes("KEUANGAN") || upper.includes("TUK")) {
          heads["tuk"] = entry;
          heads["dept-tuk"] = entry;
          heads["tata usaha & keuangan"] = entry;
          heads["tata usaha dan keuangan"] = entry;
        }
        if (upper.includes("TANAMAN") || upper.includes("TAN")) {
          heads["tan"] = entry;
          heads["dept-tan"] = entry;
          heads["tanaman"] = entry;
        }
        if (upper.includes("PABRIKASI") || upper.includes("PAB")) {
          heads["pab"] = entry;
          heads["dept-pab"] = entry;
          heads["pabrikasi"] = entry;
        }
        if (upper.includes("TEKNIK") || upper.includes("TEK")) {
          heads["tek"] = entry;
          heads["dept-tek"] = entry;
          heads["teknik"] = entry;
        }
      }
    });

    return {
      namaPemimpin: resData.leader?.namaPemimpin || "",
      jabatanPemimpin: resData.leader?.jabatanPemimpin || "",
      departmentHeads: heads,
    };
  };

  const resolveDeptHead = (
    deptObj: any,
    deptHeads: Record<string, { nama: string; jabatan: string }>
  ): { nama: string; jabatan: string } | null => {
    if (!deptObj || !deptHeads) return null;
    const deptId = (deptObj?.id || "").toLowerCase().trim();
    const deptCode = (deptObj?.code || "").toLowerCase().trim();
    const deptName = (deptObj?.name || "").toLowerCase().trim();
    const deptShort = formatDeptForLetter(deptObj?.name || "").toLowerCase().trim();

    // 1. Cocokkan langsung berdasarkan ID/Code/ShortName/FullName
    if (deptId && deptHeads[deptId]) return deptHeads[deptId];
    if (deptCode && deptHeads[deptCode]) return deptHeads[deptCode];
    if (deptShort && deptHeads[deptShort]) return deptHeads[deptShort];
    if (deptName && deptHeads[deptName]) return deptHeads[deptName];

    // 2. Pencarian khusus Bagian TUK (Tata Usaha & Keuangan)
    if (
      deptName.includes("tata usaha") ||
      deptName.includes("keuangan") ||
      deptName.includes("tuk") ||
      deptShort === "tuk"
    ) {
      if (deptHeads["dept-tuk"]) return deptHeads["dept-tuk"];
      if (deptHeads["tuk"]) return deptHeads["tuk"];
      if (deptHeads["tata usaha & keuangan"]) return deptHeads["tata usaha & keuangan"];
    }

    // 3. Pencarian khusus bagian lainnya
    if (deptName.includes("tanaman") || deptShort === "tan") {
      if (deptHeads["dept-tan"]) return deptHeads["dept-tan"];
      if (deptHeads["tan"]) return deptHeads["tan"];
    }
    if (deptName.includes("pabrikasi") || deptShort === "pab") {
      if (deptHeads["dept-pab"]) return deptHeads["dept-pab"];
      if (deptHeads["pab"]) return deptHeads["pab"];
    }
    if (deptName.includes("teknik") || deptShort === "tek") {
      if (deptHeads["dept-tek"]) return deptHeads["dept-tek"];
      if (deptHeads["tek"]) return deptHeads["tek"];
    }

    // 4. Pencarian fuzzy di seluruh daftar keys
    const found = Object.entries(deptHeads).find(([k]) => {
      if (!k) return false;
      return (
        (deptName && (deptName.includes(k) || k.includes(deptName))) ||
        (deptShort && (deptShort.includes(k) || k.includes(deptShort))) ||
        (deptCode && (deptCode.includes(k) || k.includes(deptCode)))
      );
    });

    return found ? found[1] : null;
  };

  const [signatories, setSignatories] = useState<{
    namaPemimpin: string;
    jabatanPemimpin: string;
    departmentHeads: Record<string, { nama: string; jabatan: string }>;
  }>({
    namaPemimpin: "",
    jabatanPemimpin: "",
    departmentHeads: {},
  });

  // State override khusus cetak untuk memastikan data termutakhir langsung masuk tanpa delay
  const [printSignatoryOverride, setPrintSignatoryOverride] = useState<{
    namaPemimpin?: string;
    jabatanPemimpin?: string;
    namaKepalaBagian?: string;
    jabatanKepalaBagian?: string;
  } | null>(null);

  useEffect(() => {
    getCompanyProfileAction().then((res) => {
      if (res.success && res.data) {
        setCompanyProfile({
          companyName: res.data.companyName || "PT KEBON AGUNG",
          unitName: res.data.unitName || "PABRIK GULA TRANGKIL",
          location: res.data.location || "Trangkil, Pati, Jawa Tengah",
          hrManagerName: res.data.hrManagerName || "-",
          hrManagerNip: res.data.hrManagerNip || "-",
          hrManagerTitle: res.data.hrManagerTitle || "Kepala Bagian SDM & Umum",
          currentUserName: res.data.currentUserName || "Administrator",
        });
      }
    });

    getSignatoriesAction().then((res) => {
      if (res.success && res.data) {
        setSignatories(parseSignatoriesData(res.data));
      }
    });
  }, []);

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
    return (
      <span className="inline-flex print:hidden">
        {sortField !== field ? (
          <ArrowUpDown className="h-3 w-3 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0 print:hidden" />
        ) : sortOrder === "asc" ? (
          <ArrowUp className="h-3 w-3 text-[#0093dc] font-bold shrink-0 print:hidden" />
        ) : (
          <ArrowDown className="h-3 w-3 text-[#0093dc] font-bold shrink-0 print:hidden" />
        )}
      </span>
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

  // Void / Pembatalan Cuti Modal States
  const [voidingLeaveItem, setVoidingLeaveItem] = useState<EmployeeLeaveHistoryItem | null>(null);
  const [isPendingVoid, startTransitionVoid] = useTransition();

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingLeaveItem) return;

    startTransitionVoid(async () => {
      const res = await voidLeaveRequestAction({
        leaveRequestId: voidingLeaveItem.id,
        reason: "Dibatalkan oleh Admin",
      });

      if (res.success && res.data) {
        toast.success(res.message || "Permohonan cuti berhasil dibatalkan dan saldo telah dikembalikan.");
        const restoredAnnual = (employee.balances.annual ?? 0) + (voidingLeaveItem.annualDays || 0);
        const restoredLong = (employee.balances.longLeave ?? 0) + (voidingLeaveItem.longLeaveDays || 0);
        const restoredInhal = (employee.balances.inhaldagen ?? 0) + (voidingLeaveItem.inhaldagenDays || 0);
        onEmployeeBalancesUpdated({
          annual: restoredAnnual,
          longLeave: restoredLong,
          inhaldagen: restoredInhal,
          total: restoredAnnual + restoredLong + restoredInhal,
        });
        setVoidingLeaveItem(null);
        onRefreshHistory(employee.id);
      } else {
        toast.error(res.message || "Gagal membatalkan permohonan cuti.");
      }
    });
  };

  // Direct Print States (Tanpa Pop-up Modal)
  const [printingLetterItem, setPrintingLetterItem] = useState<EmployeeLeaveHistoryItem | null>(null);
  const [isPrintingHistory, setIsPrintingHistory] = useState(false);

  // Trigger Cetak Surat Cuti langsung ke dialog cetak sistem (tanpa popup modal)
  const handlePrintLetter = async (item: EmployeeLeaveHistoryItem) => {
    toast.dismiss();
    if (typeof document !== "undefined") {
      document.querySelectorAll("[data-sonner-toaster], [data-sonner-toast], section[aria-label*='Notification']").forEach((el) => {
        (el as HTMLElement).style.setProperty("display", "none", "important");
      });
    }

    // Ambil data penandatanganan terbaru langsung dari database penandatanganan agar selalu mutakhir sesuai DB
    let currentSignatories = signatories;
    try {
      const res = await getSignatoriesAction();
      if (res.success && res.data) {
        currentSignatories = parseSignatoriesData(res.data);
        setSignatories(currentSignatories);
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data penandatanganan:", err);
    }

    // Sinkronisasi override penandatanganan agar seketika aktif sebelum dialog cetak terbuka
    const matched = resolveDeptHead(employee.department, currentSignatories.departmentHeads);
    setPrintSignatoryOverride({
      namaPemimpin: currentSignatories.namaPemimpin,
      jabatanPemimpin: currentSignatories.jabatanPemimpin,
      namaKepalaBagian: matched?.nama,
      jabatanKepalaBagian: matched?.jabatan,
    });

    setIsPrintingHistory(false);
    setPrintingLetterItem(item);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Trigger Cetak Lembar Histori Saldo langsung ke dialog cetak sistem (tanpa popup modal)
  const handlePrintHistory = () => {
    toast.dismiss();
    if (typeof document !== "undefined") {
      document.querySelectorAll("[data-sonner-toaster], [data-sonner-toast], section[aria-label*='Notification']").forEach((el) => {
        (el as HTMLElement).style.setProperty("display", "none", "important");
      });
    }
    setPrintingLetterItem(null);
    setIsPrintingHistory(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Bersihkan state cetak saat jendela cetak ditutup
  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintingLetterItem(null);
      setIsPrintingHistory(false);
      setPrintSignatoryOverride(null);
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

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
    if (dates.length === 0) {
      setEditAnnualDays(0);
      setEditLongLeaveDays(0);
      setEditInhaldagenDays(0);
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
        toast.error(res.message || "Gagal mengoreksi permohonan cuti.");
      }
    });
  };

  // Formatters & Calculations for Official Leave Letter (Surat Izin Permohonan Cuti)
  const formatDateDDMMYYYY = (val: string | Date | null | undefined) => {
    if (!val) return "-";
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) {
        if (typeof val === "string" && /^\d{2}-\d{2}-\d{4}$/.test(val)) return val;
        if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
          const [y, m, day] = val.split("-");
          return `${day}-${m}-${y}`;
        }
        return String(val);
      }
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return String(val);
    }
  };

  const calculatedLeaveBalances = useMemo(() => {
    if (!printingLetterItem) {
      return {
        saldoSebelumAnnual: 0,
        saldoSebelumLongLeave: 0,
        saldoSebelumInhaldagen: 0,
        saldoSebelumTotal: 0,
        sisaCutiHariIni: 0,
      };
    }

    const chronologicalHistory = [...history].sort((a, b) => {
      return new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime();
    });

    const itemIdx = chronologicalHistory.findIndex((h) => h.id === printingLetterItem.id);

    let subsequentAnnualDeduction = 0;
    let subsequentLongLeaveDeduction = 0;
    let subsequentInhaldagenDeduction = 0;

    if (itemIdx !== -1) {
      for (let i = itemIdx + 1; i < chronologicalHistory.length; i++) {
        const item = chronologicalHistory[i];
        if (item.transactionType === "AMBIL_CUTI") {
          subsequentAnnualDeduction += item.annualDays || 0;
          subsequentLongLeaveDeduction += item.longLeaveDays || 0;
          subsequentInhaldagenDeduction += item.inhaldagenDays || 0;
        } else if (item.transactionType === "TAMBAH_SALDO") {
          subsequentAnnualDeduction -= item.annualDays || 0;
          subsequentLongLeaveDeduction -= item.longLeaveDays || 0;
          subsequentInhaldagenDeduction -= item.inhaldagenDays || 0;
        } else if (item.transactionType === "KEDALUWARSA") {
          subsequentAnnualDeduction += item.annualDays || 0;
          subsequentLongLeaveDeduction += item.longLeaveDays || 0;
          subsequentInhaldagenDeduction += item.inhaldagenDays || 0;
        }
      }
    }

    const setelahAnnual = Math.max(0, employee.balances.annual + subsequentAnnualDeduction);
    const setelahLongLeave = Math.max(0, employee.balances.longLeave + subsequentLongLeaveDeduction);
    const setelahInhaldagen = Math.max(0, employee.balances.inhaldagen + subsequentInhaldagenDeduction);

    const sebAnnual = setelahAnnual + (printingLetterItem.annualDays || 0);
    const sebLongLeave = setelahLongLeave + (printingLetterItem.longLeaveDays || 0);
    const sebInhaldagen = setelahInhaldagen + (printingLetterItem.inhaldagenDays || 0);

    const sebTotal = sebAnnual + sebLongLeave + (isPelaksana ? 0 : sebInhaldagen);
    const sisaHari =
      sebTotal -
      ((printingLetterItem.annualDays || 0) +
        (printingLetterItem.longLeaveDays || 0) +
        (isPelaksana ? 0 : (printingLetterItem.inhaldagenDays || 0)));

    return {
      saldoSebelumAnnual: sebAnnual,
      saldoSebelumLongLeave: sebLongLeave,
      saldoSebelumInhaldagen: sebInhaldagen,
      saldoSebelumTotal: sebTotal,
      sisaCutiHariIni: sisaHari,
    };
  }, [printingLetterItem, history, employee.balances, isPelaksana]);

  // Ekstrak dan normalisasi setiap tanggal individual dari array atau comma-separated string
  const parseIndividualDateStrings = (rawList?: string[] | string | null): string[] => {
    if (!rawList) return [];
    const arr = Array.isArray(rawList) ? rawList : [rawList];
    const results: string[] = [];

    for (const item of arr) {
      if (!item || typeof item !== "string") continue;
      // Pecah jika dalam satu string terdapat beberapa tanggal yang digabung koma/spasi/newline
      const parts = item
        .split(/[,;\n\r]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      for (const part of parts) {
        if (!part) continue;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(part)) {
          results.push(part);
        } else if (/^\d{2}-\d{2}-\d{4}$/.test(part)) {
          results.push(part.replace(/-/g, "/"));
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
          const [y, m, d] = part.split("-");
          results.push(`${d}/${m}/${y}`);
        } else {
          try {
            const d = new Date(part);
            if (!isNaN(d.getTime())) {
              const day = String(d.getDate()).padStart(2, "0");
              const month = String(d.getMonth() + 1).padStart(2, "0");
              const year = d.getFullYear();
              results.push(`${day}/${month}/${year}`);
            } else {
              results.push(part);
            }
          } catch {
            results.push(part);
          }
        }
      }
    }

    return results;
  };

  const tanggalCutiList = useMemo(() => {
    if (!printingLetterItem) return [];
    if (printingLetterItem.selectedDates && printingLetterItem.selectedDates.length > 0) {
      const parsed = parseIndividualDateStrings(printingLetterItem.selectedDates);
      if (parsed.length > 0) return parsed;
    }
    if (printingLetterItem.startDate) {
      if (printingLetterItem.startDate === printingLetterItem.endDate) {
        return parseIndividualDateStrings([printingLetterItem.startDate]);
      }
      return [`${formatDateDDMMYYYY(printingLetterItem.startDate)} s/d ${formatDateDDMMYYYY(printingLetterItem.endDate)}`];
    }
    return [];
  }, [printingLetterItem]);

  // Kelompokkan menjadi baris-baris (maksimal 4 tanggal per baris ke kanan, max 3 baris ke bawah)
  const tanggalCutiRows = useMemo(() => {
    const list = tanggalCutiList;
    if (list.length === 0) return [];
    if (list.length === 1 && list[0].includes("s/d")) {
      return [list];
    }
    const rows: string[][] = [];
    for (let i = 0; i < list.length; i += 4) {
      rows.push(list.slice(i, i + 4));
    }
    return rows;
  }, [tanggalCutiList]);

  // Singkat "Tata Usaha & Keuangan" menjadi "TUK" agar rapi & tidak melipat baris
  const formatDeptForLetter = (deptName?: string | null) => {
    if (!deptName) return "-";
    const upper = deptName.trim().toUpperCase();
    if (
      upper.includes("TATA USAHA") ||
      upper.includes("KEUANGAN") ||
      upper.includes("TU &") ||
      upper.includes("TU DAN") ||
      upper === "TU" ||
      upper === "TUK"
    ) {
      return "TUK";
    }
    return deptName;
  };

  const resolvedHead = resolveDeptHead(employee.department, signatories.departmentHeads);
  const matchedDeptHead = printSignatoryOverride?.namaKepalaBagian
    ? {
        nama: printSignatoryOverride.namaKepalaBagian,
        jabatan: printSignatoryOverride.jabatanKepalaBagian || resolvedHead?.jabatan || "",
      }
    : resolvedHead;

  const namaPemimpin =
    printSignatoryOverride?.namaPemimpin ||
    signatories.namaPemimpin ||
    "Pimpinan";
  const jabatanPemimpin =
    printSignatoryOverride?.jabatanPemimpin ||
    signatories.jabatanPemimpin ||
    "Pemimpin";
  const namaKepalaBagian =
    printSignatoryOverride?.namaKepalaBagian ||
    matchedDeptHead?.nama ||
    "-";
  const jabatanKepalaBagian =
    printSignatoryOverride?.jabatanKepalaBagian ||
    matchedDeptHead?.jabatan ||
    `Kepala Bagian ${formatDeptForLetter(employee.department?.name)}`;
  const adminName = companyProfile.currentUserName || printingLetterItem?.createdByName || "Administrator";
  const tanggalPermohonan = formatDateDDMMYYYY(printingLetterItem?.requestDate || new Date());

  const renderSlipPermohonanCuti = (slipKey: string) => {
    if (!printingLetterItem) return null;
    return (
      <div key={slipKey} className="w-full h-full text-black font-sans text-[11px] leading-tight select-none flex flex-col justify-between">
        {/* KOP HEADER: LOGO KIRI, JUDUL DEAD-CENTER SIMETRIS (TIDAK NABRAK) */}
        <div className="relative w-full flex items-center justify-center min-h-[30px] mb-1.5">
          {/* LOGO PG TRANGKIL (POJOK KIRI ATAS, PROPORSIONAL & RESOLUSI TAJAM) */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
            <Image
              src="/assets/PGTrangkilLogo.png"
              alt="Logo PG Trangkil"
              width={140}
              height={20}
              priority
              unoptimized
              className="h-[20px] w-auto object-contain shrink-0"
            />
          </div>

          {/* JUDUL RESMI (DEAD-CENTER TERHADAP KERTAS, DIKUNCI MAX-WIDTH AGAR BEBAS TABRAKAN) */}
          <div className="text-center max-w-[390px] mx-auto px-1">
            <h2 className="font-bold text-[11.5px] uppercase tracking-wide text-black leading-tight">
              {isPelaksana
                ? `PERMOHONAN CUTI KARYAWAN PELAKSANA BAGIAN ${formatDeptForLetter(employee.department.name).toUpperCase()}`
                : "PERMOHONAN CUTI KARYAWAN PIMPINAN"}
            </h2>
          </div>
        </div>

        {/* BLOK DATA KARYAWAN & PERHITUNGAN SALDO (TRUE DEAD-CENTER KERTAS) */}
        <div
          className="w-fit self-center mx-auto text-[11px] text-black space-y-2 mt-1"
          style={{ width: "fit-content" }}
        >
          {/* IDENTITAS */}
          <div className="space-y-0.5">
            <div className="grid grid-cols-[100px_10px_1fr]">
              <span>Nama</span>
              <span>:</span>
              <span className="font-semibold text-black">{employee.name}</span>
            </div>
            <div className="grid grid-cols-[100px_10px_1fr]">
              <span>Jabatan</span>
              <span>:</span>
              <span>{employee.position || "-"}</span>
            </div>
            <div className="grid grid-cols-[100px_10px_1fr]">
              <span>Bagian</span>
              <span>:</span>
              <span>{formatDeptForLetter(employee.department.name)}</span>
            </div>
            <div className="grid grid-cols-[100px_10px_1fr]">
              <span>Stasiun</span>
              <span>:</span>
              <span>{employee.stasiun || "-"}</span>
            </div>
            <div className="grid grid-cols-[100px_10px_1fr]">
              <span>Keperluan</span>
              <span>:</span>
              <span>{printingLetterItem.purpose || "-"}</span>
            </div>
          </div>

          {/* SISA SALDO YANG LALU */}
          <div>
            <p className="font-bold underline italic">Sisa Saldo yang lalu :</p>
            <div className="space-y-0.5 mt-0.5">
              <div className="grid grid-cols-[100px_10px_36px_1fr]">
                <span>- Cuti tahunan</span>
                <span>:</span>
                <span className="text-right font-mono pr-1.5">{calculatedLeaveBalances.saldoSebelumAnnual}</span>
                <span>hari</span>
              </div>
              <div className="grid grid-cols-[100px_10px_36px_1fr]">
                <span>- Cuti Besar</span>
                <span>:</span>
                <span className="text-right font-mono pr-1.5">{calculatedLeaveBalances.saldoSebelumLongLeave}</span>
                <span>hari</span>
              </div>
              {!isPelaksana && (
                <div className="grid grid-cols-[100px_10px_36px_1fr]">
                  <span>- Inhaaldagen</span>
                  <span>:</span>
                  <span className="text-right font-mono pr-1.5">{calculatedLeaveBalances.saldoSebelumInhaldagen}</span>
                  <span>hari</span>
                </div>
              )}
              <div className="grid grid-cols-[100px_10px_1fr]">
                <span />
                <span />
                <div className="w-[72px] border-b border-black my-0.5" />
              </div>
              <div className="grid grid-cols-[100px_10px_36px_1fr] font-bold">
                <span>Jumlah</span>
                <span>:</span>
                <span className="text-right font-mono pr-1.5">{calculatedLeaveBalances.saldoSebelumTotal}</span>
                <span className="font-normal">hari</span>
              </div>
            </div>
          </div>

          {/* PERMOHONAN CUTI */}
          <div>
            <p className="font-bold underline italic">Permohonan cuti :</p>
            <div className="space-y-0.5 mt-0.5">
              <div className="grid grid-cols-[100px_10px_1fr] items-start">
                <span>- Tanggal</span>
                <span>:</span>
                <div className="font-medium text-black">
                  {tanggalCutiRows.length === 0 ? (
                    <span>-</span>
                  ) : tanggalCutiRows.length === 1 && tanggalCutiRows[0][0].includes("s/d") ? (
                    <span>{tanggalCutiRows[0][0]}</span>
                  ) : (
                    <div className="flex flex-col gap-y-1">
                      {tanggalCutiRows.map((rowDates, rIdx) => {
                        const isLastRow = rIdx === tanggalCutiRows.length - 1;
                        return (
                          <div
                            key={rIdx}
                            className="flex items-center gap-x-2 text-[10.5px] leading-tight font-medium flex-wrap"
                          >
                            {rowDates.map((d, cIdx) => {
                              const isAbsoluteLast = isLastRow && cIdx === rowDates.length - 1;
                              return (
                                <span key={cIdx} className="whitespace-nowrap">
                                  {d}{!isAbsoluteLast ? "," : ""}
                                </span>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-[100px_10px_36px_1fr]">
                <span>- Cuti tahunan</span>
                <span>:</span>
                <span className="text-right font-mono pr-1.5">
                  {printingLetterItem.annualDays > 0 ? `-${printingLetterItem.annualDays}` : "-"}
                </span>
                <span>hari</span>
              </div>
              <div className="grid grid-cols-[100px_10px_36px_1fr]">
                <span>- Cuti Besar</span>
                <span>:</span>
                <span className="text-right font-mono pr-1.5">
                  {printingLetterItem.longLeaveDays > 0 ? `-${printingLetterItem.longLeaveDays}` : "-"}
                </span>
                <span>hari</span>
              </div>
              {!isPelaksana && (
                <div className="grid grid-cols-[100px_10px_36px_1fr]">
                  <span>- Inhaaldagen</span>
                  <span>:</span>
                  <span className="text-right font-mono pr-1.5">
                    {printingLetterItem.inhaldagenDays > 0 ? `-${printingLetterItem.inhaldagenDays}` : "-"}
                  </span>
                  <span>hari</span>
                </div>
              )}
              <div className="grid grid-cols-[100px_10px_1fr]">
                <span />
                <span />
                <div className="w-[72px] border-b border-black my-0.5" />
              </div>
              <div className="grid grid-cols-[100px_10px_36px_1fr] font-bold">
                <span className="whitespace-nowrap">Sisa cuti hari ini</span>
                <span>:</span>
                <span className="text-right font-mono pr-1.5">{calculatedLeaveBalances.sisaCutiHariIni}</span>
                <span className="font-normal">hari</span>
              </div>
              <div className="grid grid-cols-[100px_10px_1fr]">
                <span />
                <span />
                <div className="w-[72px] border-b border-black my-0.5" />
              </div>
            </div>
          </div>
        </div>

        {/* TANDA TANGAN & FOOTER (JABATAN DITARIK KE ATAS, CATATAN DEKAT DI BAWAH TTD) */}
        <div className="w-full text-[11px] text-black mt-3 flex-1 flex flex-col">
          <div>
            <div className="grid grid-cols-3 text-center mb-1 px-4">
              <div className="col-span-2 text-center font-normal">
                <span>Mengetahui / Menyetujui</span>
              </div>
              <div className="text-center font-normal">
                <span>Trangkil, {tanggalPermohonan}</span>
              </div>
            </div>

            {!isPelaksana ? (
              <div className="grid grid-cols-3 text-center px-4">
                <div>
                  <p className="font-normal">{jabatanPemimpin}</p>
                  <div className="h-20" />
                  <p className="font-bold">{namaPemimpin}</p>
                </div>
                <div>
                  <p className="font-normal">{jabatanKepalaBagian}</p>
                  <div className="h-20" />
                  <p className="font-bold">{namaKepalaBagian}</p>
                </div>
                <div>
                  <p className="font-normal">Pemohon</p>
                  <div className="h-20" />
                  <p className="font-bold">{employee.name}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 text-center px-4">
                <div>
                  <p className="font-normal">{jabatanKepalaBagian}</p>
                  <div className="h-20" />
                  <p className="font-bold">{namaKepalaBagian}</p>
                </div>
                <div>
                  <p className="font-normal">Kasi / Kasubsi</p>
                  <div className="h-20" />
                  <p className="font-bold">&nbsp;</p>
                </div>
                <div>
                  <p className="font-normal">Pemohon</p>
                  <div className="h-20" />
                  <p className="font-bold">{employee.name}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-start mt-2.5 px-1">
            <div>
              <p className="underline italic">Catatan :</p>
              {printingLetterItem.notes && (
                <p className="text-[10px] text-slate-700 italic ml-2 mt-0.5">
                  {printingLetterItem.notes}
                </p>
              )}
            </div>
            <div className="italic text-[10px] text-black text-right">
              Admin : {adminName}
            </div>
          </div>
        </div>
      </div>
    );
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
                onClick={handlePrintHistory}
                className="font-medium gap-1.5 h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-3.5 w-3.5" />
                Cetak Histori Saldo
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
                    <TableHead className="text-center min-w-[260px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 text-xs">
                  {sortedHistory.map((item, idx) => {
                    const isTambah = item.transactionType === "TAMBAH_SALDO";
                    const isKedaluwarsa = item.transactionType === "KEDALUWARSA";
                    const isOtomatis = item.purpose?.startsWith("AUTO_") || item.uraian?.toLowerCase().includes("otomatis");

                    return (
                      <TableRow key={item.id} className={cn("transition-colors", isKedaluwarsa ? "bg-amber-50/20 hover:bg-amber-50/40" : "hover:bg-slate-50/70")}>
                        <TableCell className="text-center font-mono text-slate-400 font-medium">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="text-center font-mono text-slate-700">
                          {formatDateIndo(item.requestDate)}
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{item.uraian || (isTambah ? "Penambahan Saldo" : isKedaluwarsa ? "Kedaluwarsa Kuota (Hangus)" : "Pengambilan Cuti")}</span>
                            {isKedaluwarsa && (
                              <Badge variant="outline" className="text-[10px] bg-amber-50 border-amber-200 text-amber-700 font-semibold px-1.5 py-0">
                                Hangus
                              </Badge>
                            )}
                            {isTambah && isOtomatis && (
                              <Badge variant="outline" className="text-[10px] bg-blue-50 border-blue-200 text-blue-700 font-semibold px-1.5 py-0">
                                Otomatis SK
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isTambah || isKedaluwarsa ? (
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
                            ) : isKedaluwarsa ? (
                              <span className="font-mono font-bold text-amber-600">-{item.annualDays}</span>
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
                            ) : isKedaluwarsa ? (
                              <span className="font-mono font-bold text-amber-600">-{item.longLeaveDays}</span>
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
                              ) : isKedaluwarsa ? (
                                <span className="font-mono font-bold text-amber-600">-{item.inhaldagenDays}</span>
                              ) : (
                                <span className="font-mono font-bold text-red-600">-{item.inhaldagenDays}</span>
                              )
                            ) : (
                              <span className="text-slate-300 font-mono">-</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          {isTambah || isKedaluwarsa ? (
                            <span className="text-slate-300 font-mono">-</span>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditModal(item)}
                                className="gap-1 h-7 text-[11px] font-medium text-amber-700 bg-amber-50/60 hover:bg-amber-100/80 border-amber-200"
                                title="Koreksi Permohonan Cuti (Ubah Tanggal)"
                              >
                                <Pencil className="h-3 w-3 text-amber-600" />
                                Koreksi
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setVoidingLeaveItem(item)}
                                className="gap-1 h-7 text-[11px] font-medium text-red-700 bg-red-50/60 hover:bg-red-100/80 border-red-200"
                                title="Batalkan Permohonan Cuti & Pulihkan Saldo"
                              >
                                <RotateCcw className="h-3 w-3 text-red-600" />
                                Batalkan
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrintLetter(item)}
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
          <DialogHeader className="pr-8">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Pencil className="h-5 w-5 text-amber-600" />
              Koreksi Permohonan Cuti
            </DialogTitle>
            <DialogDescription>
              Ubah tanggal cuti yang diambil atau sesuaikan alokasi saldo. Perubahan hari akan otomatis menyesuaikan saldo karyawan.
            </DialogDescription>
          </DialogHeader>

          {editingLeaveItem && (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-1">
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
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 tracking-tight">
                      Alokasi Hari per Jenis Cuti
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Bagikan kuota cuti sesuai jumlah tanggal yang dipilih
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-2xs text-[11px] font-medium text-slate-600">
                      <span className="text-slate-400">Dipilih:</span>
                      <span className="font-bold text-blue-600">{editSelectedDates.length} hari</span>
                    </div>
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-2xs text-[11px] font-medium transition-colors",
                        isEditAllocationMismatch
                          ? "bg-amber-50 border-amber-300 text-amber-800"
                          : "bg-emerald-50 border-emerald-300 text-emerald-800"
                      )}
                    >
                      <span className="opacity-70">Alokasi:</span>
                      <span className="font-bold">{editTotalAllocated} hari</span>
                    </div>
                  </div>
                </div>

                {isEditAllocationMismatch && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-800">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>
                      Total alokasi ({editTotalAllocated} hari) belum sesuai dengan {editSelectedDates.length} tanggal yang dipilih.
                    </span>
                  </div>
                )}

                {/* Dedicated Card: Sisa Saldo Setelah Cuti */}
                <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 text-blue-600" />
                      Sisa Saldo Setelah Cuti
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Otomatis terpotong sesuai alokasi
                    </span>
                  </div>

                  <div className={`grid grid-cols-1 ${isPelaksana ? "grid-cols-2" : "grid-cols-3"} gap-2`}>
                    {/* Tahunan Stat */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-100/70">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-xs font-medium text-slate-700">Tahunan</span>
                      </div>
                      <div className="flex items-baseline gap-1 font-mono">
                        <motion.span
                          key={editRemainingAnnual}
                          initial={{ scale: 1.25, color: "#2563eb" }}
                          animate={{ scale: 1, color: "#1d4ed8" }}
                          transition={{ duration: 0.2 }}
                          className="text-sm font-bold text-blue-700"
                        >
                          <AnimatedNumber value={Math.max(0, editRemainingAnnual)} />
                        </motion.span>
                        <span className="text-[10px] text-slate-400">/ {editMaxAnnual} hr</span>
                      </div>
                    </div>

                    {/* Besar Stat */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50/50 border border-purple-100/70">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                        <span className="text-xs font-medium text-slate-700">Besar</span>
                      </div>
                      <div className="flex items-baseline gap-1 font-mono">
                        <motion.span
                          key={editRemainingLongLeave}
                          initial={{ scale: 1.25, color: "#9333ea" }}
                          animate={{ scale: 1, color: "#7e22ce" }}
                          transition={{ duration: 0.2 }}
                          className="text-sm font-bold text-purple-700"
                        >
                          <AnimatedNumber value={Math.max(0, editRemainingLongLeave)} />
                        </motion.span>
                        <span className="text-[10px] text-slate-400">/ {editMaxLongLeave} hr</span>
                      </div>
                    </div>

                    {/* Inhaldagen Stat */}
                    {!isPelaksana && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100/70">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-xs font-medium text-slate-700">Inhaldagen</span>
                        </div>
                        <div className="flex items-baseline gap-1 font-mono">
                          <motion.span
                            key={editRemainingInhaldagen}
                            initial={{ scale: 1.25, color: "#059669" }}
                            animate={{ scale: 1, color: "#047857" }}
                            transition={{ duration: 0.2 }}
                            className="text-sm font-bold text-emerald-700"
                          >
                            <AnimatedNumber value={Math.max(0, editRemainingInhaldagen)} />
                          </motion.span>
                          <span className="text-[10px] text-slate-400">/ {editMaxInhaldagen} hr</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`grid grid-cols-1 ${isPelaksana ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-2.5`}>
                  {/* Tahunan Card */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 hover:border-slate-300 transition-all">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        <span className="font-semibold text-slate-800">Cuti Tahunan</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        Maks {editMaxAnnual}
                      </span>
                    </div>
                    <StepperHari
                      id="editAnnualDays"
                      min={0}
                      max={editMaxAnnual}
                      value={editAnnualDays}
                      onChange={setEditAnnualDays}
                      disabled={isPendingEdit}
                      isError={isEditExceedingAnnual}
                    />
                    {isEditExceedingAnnual && (
                      <p className="text-[10px] text-red-600 font-medium">Melebihi batas saldo!</p>
                    )}
                  </div>

                  {/* Cuti Besar Card */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 hover:border-slate-300 transition-all">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                        <span className="font-semibold text-slate-800">Cuti Besar</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        Maks {editMaxLongLeave}
                      </span>
                    </div>
                    <StepperHari
                      id="editLongLeaveDays"
                      min={0}
                      max={editMaxLongLeave}
                      value={editLongLeaveDays}
                      onChange={setEditLongLeaveDays}
                      disabled={isPendingEdit}
                      isError={isEditExceedingLongLeave}
                    />
                    {isEditExceedingLongLeave && (
                      <p className="text-[10px] text-red-600 font-medium">Melebihi batas saldo!</p>
                    )}
                  </div>

                  {/* Inhaldagen Card (HANYA UNTUK KARYAWAN PIMPINAN) */}
                  {!isPelaksana && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 hover:border-slate-300 transition-all">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-semibold text-slate-800">Inhaldagen</span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                          Maks {editMaxInhaldagen}
                        </span>
                      </div>
                      <StepperHari
                        id="editInhaldagenDays"
                        min={0}
                        max={editMaxInhaldagen}
                        value={editInhaldagenDays}
                        onChange={setEditInhaldagenDays}
                        disabled={isPendingEdit}
                        isError={isEditExceedingInhaldagen}
                      />
                      {isEditExceedingInhaldagen && (
                        <p className="text-[10px] text-red-600 font-medium">Melebihi batas saldo!</p>
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

              <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const itemToVoid = editingLeaveItem;
                      setEditingLeaveItem(null);
                      setVoidingLeaveItem(itemToVoid);
                    }}
                    disabled={isPendingEdit}
                    className="w-full sm:w-auto h-9 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-red-600" />
                    Batalkan Cuti Ini
                  </Button>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingLeaveItem(null)}
                    disabled={isPendingEdit}
                    className="h-9 text-xs"
                  >
                    Tutup
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
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* POPUP MODAL: BATALKAN PERMOHONAN CUTI */}
      <Dialog open={!!voidingLeaveItem} onOpenChange={(open) => !open && !isPendingVoid && setVoidingLeaveItem(null)}>
        <DialogContent onClose={() => setVoidingLeaveItem(null)} className="max-w-lg p-5 sm:p-6">
          <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100 pr-8">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-red-700">
              <span className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200">
                <AlertTriangle className="h-4 w-4" />
              </span>
              Batalkan Permohonan Cuti
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tindakan ini akan membatalkan permohonan cuti dan mengembalikan seluruh kuota hari cuti ke saldo karyawan.
            </DialogDescription>
          </DialogHeader>

          {voidingLeaveItem && (
            <form onSubmit={handleConfirmVoid} className="space-y-4 mt-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500 font-medium">Karyawan:</span>
                  <span className="font-bold text-slate-900">{employee.name} ({employee.department.name})</span>
                </div>
                <div className="flex items-start justify-between border-b border-slate-200/80 pb-2 gap-2">
                  <span className="text-slate-500 font-medium shrink-0">Tanggal Cuti:</span>
                  <span className="font-mono text-slate-800 text-right font-semibold">
                    {voidingLeaveItem.selectedDates && voidingLeaveItem.selectedDates.length > 0
                      ? voidingLeaveItem.selectedDates.join(", ")
                      : `${formatDateIndo(voidingLeaveItem.startDate)} s/d ${formatDateIndo(voidingLeaveItem.endDate)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Keperluan:</span>
                  <span className="text-slate-800 italic">{voidingLeaveItem.purpose || "-"}</span>
                </div>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                  <RotateCcw className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Saldo yang akan Dipulihkan:</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-white/90 p-2 rounded-lg border border-emerald-100 text-center">
                    <span className="text-[10px] text-slate-500 block">Tahunan</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">+{voidingLeaveItem.annualDays} hr</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg border border-emerald-100 text-center">
                    <span className="text-[10px] text-slate-500 block">Cuti Besar</span>
                    <span className="font-mono font-bold text-purple-700 text-sm">+{voidingLeaveItem.longLeaveDays} hr</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg border border-emerald-100 text-center">
                    <span className="text-[10px] text-slate-500 block">Inhaldagen</span>
                    <span className="font-mono font-bold text-blue-700 text-sm">+{voidingLeaveItem.inhaldagenDays} hr</span>
                  </div>
                </div>
                <div className="text-right pt-0.5">
                  <span className="text-[11px] text-emerald-800 font-medium">
                    Total dikembalikan: <strong className="font-mono font-bold text-emerald-900">+{voidingLeaveItem.totalDays} hari</strong>
                  </span>
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVoidingLeaveItem(null)}
                  disabled={isPendingVoid}
                  className="h-9 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPendingVoid}
                  className="gap-1.5 h-9 text-xs bg-red-600 hover:bg-red-700 text-white font-medium"
                >
                  {isPendingVoid ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Membatalkan Cuti...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Konfirmasi Pembatalan Cuti
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ELEMEN CETAK SURAT IZIN CUTI (2 RANGKAP ATAS & BAWAH: TEPAT 50:50 WILAYAH KEKUASAAN) */}
      {typeof document !== "undefined" && printingLetterItem && createPortal(
        <div className="hidden print:block print:w-full print:m-0 print:p-0 print-leave-letter-page">
          <div
            id="printable-leave-letter"
            className="w-[210mm] text-black font-sans bg-white print:p-0 print:m-0 flex flex-col justify-between mx-auto"
            style={{ width: "210mm", height: "276mm", maxHeight: "276mm" }}
          >
            {/* SLIP 1 (ATAS) - TEPAT 50% WILAYAH KEKUASAAN (138mm) */}
            <div
              className="w-full box-border border-b border-dashed border-slate-400 print:border-slate-400 overflow-hidden flex flex-col justify-between"
              style={{ height: "138mm", maxHeight: "138mm", padding: "6mm 16mm 5mm 16mm" }}
            >
              {renderSlipPermohonanCuti("slip-top")}
            </div>

            {/* SLIP 2 (BAWAH) - TEPAT 50% WILAYAH KEKUASAAN (138mm) */}
            <div
              className="w-full box-border overflow-hidden flex flex-col justify-between"
              style={{ height: "138mm", maxHeight: "138mm", padding: "6mm 16mm 5mm 16mm" }}
            >
              {renderSlipPermohonanCuti("slip-bottom")}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ELEMEN CETAK LEMBAR REKAP AKTIVITAS SALDO (LANGSUNG CETAK TANPA POPUP / MODAL) */}
      {typeof document !== "undefined" && isPrintingHistory && createPortal(
        <div className="hidden print:block print:w-full print:m-0 print:p-0 print-page-wrapper">
          <div
            id="printable-history-sheet"
            className="text-slate-900 text-xs font-sans print:border-none print:shadow-none print:p-0 print:m-0 print:space-y-3 relative"
          >
            {/* Header Kop: Logo PG Trangkil di Kiri & Alamat di Bawahnya */}
            <div className="border-b-2 border-black pb-2.5">
              <div className="flex flex-col items-start gap-1">
                <Image
                  src="/assets/PGTrangkilLogo.png"
                  alt="Logo PG Trangkil"
                  width={180}
                  height={36}
                  priority
                  className="h-9 w-auto object-contain"
                />
                <div className="text-[9px] text-black leading-tight mt-0.5 font-sans">
                  {companyProfile.location}
                </div>
              </div>
            </div>

            {/* Judul Dokumen Resmi */}
            <div className="text-center mt-3 mb-2">
              <h1 className="text-sm font-black uppercase text-black tracking-wide">
                KARTU HISTORI AKTIVITAS SALDO CUTI KARYAWAN
              </h1>
              <p className="text-[11px] text-black mt-0.5">
                Kategori: {isPelaksana ? "Pelaksana" : "Pimpinan"}
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
                {sortedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={isPelaksana ? 6 : 7} className="border border-slate-300 p-4 text-center text-slate-500 italic">
                      Belum ada riwayat aktivitas saldo cuti.
                    </td>
                  </tr>
                ) : (
                  sortedHistory.map((h, i) => {
                    const isTambah = h.transactionType === "TAMBAH_SALDO";
                    return (
                      <tr key={h.id} className="hover:bg-slate-50">
                        <td className="border border-slate-300 p-2 text-center font-mono">{i + 1}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono">{formatDateIndo(h.requestDate)}</td>
                        <td className="border border-slate-300 p-2 font-medium">{h.uraian || (isTambah ? "Penambahan Saldo" : "Pengambilan Cuti")}</td>
                        <td className="border border-slate-300 p-2 font-mono">
                          {isTambah ? "-" : (h.selectedDates && h.selectedDates.length > 0 ? h.selectedDates.join(", ") : `${formatDateIndo(h.startDate)} s/d ${formatDateIndo(h.endDate)}`)}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                          {h.annualDays > 0 ? (
                            isTambah ? <span className="text-emerald-700">+{h.annualDays}</span> : <span className="text-red-600">-{h.annualDays}</span>
                          ) : <span className="text-slate-400 font-normal">-</span>}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                          {h.longLeaveDays > 0 ? (
                            isTambah ? <span className="text-emerald-700">+{h.longLeaveDays}</span> : <span className="text-red-600">-{h.longLeaveDays}</span>
                          ) : <span className="text-slate-400 font-normal">-</span>}
                        </td>
                        {!isPelaksana && (
                          <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                            {h.inhaldagenDays > 0 ? (
                              isTambah ? <span className="text-emerald-700">+{h.inhaldagenDays}</span> : <span className="text-red-600">-{h.inhaldagenDays}</span>
                            ) : <span className="text-slate-400 font-normal">-</span>}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Sisa Saldo Terkini */}
            <div className="text-right text-xs pt-1">
              <span className="font-semibold text-slate-800">
                Total Sisa Saldo Cuti Saat Ini: <strong className="font-mono text-blue-900">{employee.balances.total} Hari</strong> (Tahunan: {employee.balances.annual} hr, Besar: {employee.balances.longLeave} hr{!isPelaksana ? `, Inhaldagen: ${employee.balances.inhaldagen} hr` : ""})
              </span>
            </div>

            {/* PRINT-ONLY FOOTER: POJOK KIRI BAWAH KERTAS (HANYA NAMA & TANGGAL TANPA LABEL) */}
            <div className="hidden print:block print:fixed print:bottom-3 print:left-4 text-left text-[9px] text-black font-sans leading-tight">
              <div>{companyProfile.currentUserName}</div>
              <div>{formatDateIndo(new Date())}</div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export { BalanceActivityCard as KartuAktivitasSaldo };
