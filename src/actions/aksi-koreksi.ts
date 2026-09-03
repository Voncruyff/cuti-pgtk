"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";
import type { ActionResult } from "@/types/actions";

export interface LeaveRequestCorrectionItem {
  id: string;
  requestNumber: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  station?: string;
  category?: string;
  position?: string;
  requestDate: string;
  startDate: string;
  endDate: string;
  selectedDates?: string[];
  totalDays: number;
  annualDays: number;
  longLeaveDays: number;
  inhaldagenDays: number;
  purpose: string;
  notes?: string | null;
  status: "APPROVED" | "CANCELLED";
  createdByName?: string;
  createdAt: string;
  cancelledAt?: string | null;
  cancelledByName?: string | null;
  cancelReason?: string | null;
  currentBalances?: {
    annual: number;
    longLeave: number;
    inhaldagen: number;
    total: number;
  };
}

/**
 * Konversi tanggal yang aman, menangani format DD/MM/YYYY, YYYY-MM-DD, maupun objek Date
 */
function safeToIsoDate(input: unknown): string {
  if (!input) return new Date().toISOString();
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? new Date().toISOString() : input.toISOString();
  }
  const str = String(input).trim();
  if (!str) return new Date().toISOString();

  // Format DD/MM/YYYY (contoh: 15/10/2026)
  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts.map((p) => parseInt(p, 10));
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        const dt = new Date(Date.UTC(y, m - 1, d));
        if (!isNaN(dt.getTime())) return dt.toISOString();
      }
    }
  }

  // Format YYYY-MM-DD atau ISO standar
  const dt = new Date(str);
  if (!isNaN(dt.getTime())) return dt.toISOString();

  return new Date().toISOString();
}

export async function getLeaveRequestsForCorrectionAction(params?: {
  search?: string;
  department?: string;
  status?: string;
}) {
  const user = await requireAuth();

  try {
    const activities = await prisma.balanceActivity.findMany({
      where: {
        jenisTransaksi: "AMBIL_CUTI",
      },
      include: {
        employee: {
          include: {
            station: true,
            leaveBalance: true,
          },
        },
      },
      orderBy: [
        { tglTransaksi: "desc" },
        { createdAt: "desc" },
      ],
    });

    let items: LeaveRequestCorrectionItem[] = activities.map((act) => {
      const emp = act.employee;
      const bal = emp?.leaveBalance;
      const totalDays = act.totalHari || (act.cutiTahunan + act.cutiBesar + act.inhaldagen) || 1;
      const tglCutiStr = String(act.tglCuti || "");
      const datesList = tglCutiStr
        ? tglCutiStr.split(", ").map((s) => s.trim()).filter(Boolean)
        : [];

      const txDate = act.tglTransaksi || act.createdAt || new Date();
      const txIso = safeToIsoDate(txDate);
      const startIso = datesList[0] ? safeToIsoDate(datesList[0]) : txIso;
      const endIso = datesList[datesList.length - 1] ? safeToIsoDate(datesList[datesList.length - 1]) : startIso;

      return {
        id: act.id,
        requestNumber: `REQ-${act.nip}-${new Date(txDate).getTime()}`,
        employeeId: emp?.id || act.nip,
        employeeName: emp?.nama || act.nama || "Karyawan",
        employeeNumber: act.nip,
        department: emp?.bagian || "-",
        station: emp?.stasiun || emp?.station?.name || "-",
        category: emp?.category || "PIMPINAN",
        position: emp?.jabatan || "-",
        requestDate: txIso,
        startDate: startIso,
        endDate: endIso,
        selectedDates: datesList,
        totalDays,
        annualDays: act.cutiTahunan,
        longLeaveDays: act.cutiBesar,
        inhaldagenDays: act.inhaldagen,
        purpose: act.keperluan || act.uraian || "Pengambilan Cuti",
        notes: act.uraian || "",
        status: "APPROVED",
        createdByName: "Admin",
        createdAt: safeToIsoDate(act.createdAt || txDate),
        currentBalances: {
          annual: bal?.cutiTahunan ?? 0,
          longLeave: bal?.cutiBesar ?? 0,
          inhaldagen: bal?.inhaldagen ?? 0,
          total: bal?.total ?? 0,
        },
      };
    });

    // Role Filtering untuk Admin Bagian
    if (user.role === "ADMIN_BAGIAN" && user.department && user.department !== "ALL") {
      const userDept = user.department.toLowerCase();
      items = items.filter((item) => {
        const itemDept = item.department.toLowerCase();
        return itemDept.includes(userDept) || userDept.includes(itemDept);
      });
    }

    // Filter search
    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.employeeName.toLowerCase().includes(q) ||
          item.employeeNumber.toLowerCase().includes(q) ||
          item.requestNumber.toLowerCase().includes(q) ||
          item.department.toLowerCase().includes(q) ||
          item.purpose.toLowerCase().includes(q)
      );
    }

    // Filter department
    if (params?.department && params.department !== "ALL") {
      const targetDept = params.department.toLowerCase();
      items = items.filter((item) => item.department.toLowerCase().includes(targetDept));
    }

    return {
      success: true,
      data: items,
    };
  } catch (error) {
    console.error("Get leave requests for correction error:", error);
    return {
      success: false,
      message: "Gagal memuat daftar permohonan cuti.",
      data: [],
    };
  }
}

export interface UpdateLeaveRequestCorrectionInput {
  activityId: string;
  employeeId: string;
  requestDate: string;
  selectedDates: string[];
  annualDays: number;
  longLeaveDays: number;
  inhaldagenDays: number;
  purpose: string;
  notes?: string;
}

export async function updateLeaveRequestCorrectionAction(
  input: UpdateLeaveRequestCorrectionInput
): Promise<ActionResult<{ updatedBalances: { annual: number; longLeave: number; inhaldagen: number; total: number } }>> {
  const user = await requireAuth();

  try {
    const {
      activityId,
      employeeId,
      requestDate,
      selectedDates,
      annualDays,
      longLeaveDays,
      inhaldagenDays,
      purpose,
    } = input;

    // Cari data karyawan berdasarkan ID atau NIP
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [{ id: employeeId }, { nip: employeeId }],
      },
      include: {
        leaveBalance: true,
      },
    });

    if (!employee) {
      return {
        success: false,
        message: "Data karyawan tidak ditemukan di database.",
      };
    }

    // Pemeriksaan hak akses Admin Bagian
    if (user.role === "ADMIN_BAGIAN" && user.department && user.department !== "ALL") {
      const userDept = user.department.toLowerCase();
      const empDept = employee.bagian.toLowerCase();
      if (!empDept.includes(userDept) && !userDept.includes(empDept)) {
        return {
          success: false,
          message: `Anda hanya memiliki hak akses untuk mengoreksi cuti karyawan bagian ${user.department}.`,
        };
      }
    }

    // Ambil transaksi yang sedang dikoreksi
    const existing = await prisma.balanceActivity.findFirst({
      where: {
        id: activityId,
        nip: employee.nip,
      },
    });

    if (!existing) {
      return {
        success: false,
        message: "Data transaksi cuti yang ingin dikoreksi tidak ditemukan.",
      };
    }

    if (existing.jenisTransaksi !== "AMBIL_CUTI") {
      return {
        success: false,
        message: "Hanya transaksi pengambilan cuti yang dapat dikoreksi.",
      };
    }

    // Pengurangan sebelumnya pada transaksi ini
    const oldAnnual = Number(existing.cutiTahunan) || 0;
    const oldLongLeave = Number(existing.cutiBesar) || 0;
    const oldInhaldagen = Number(existing.inhaldagen) || 0;

    // Saldo karyawan saat ini
    const balanceRecord = employee.leaveBalance;
    const currentAnnual = balanceRecord?.cutiTahunan ?? 0;
    const currentLongLeave = balanceRecord?.cutiBesar ?? 0;
    const currentInhaldagen = balanceRecord?.inhaldagen ?? 0;

    // Saldo efektif sebelum transaksi baru dialokasikan (saldo sekarang + pengembalian jatah lama)
    const effectiveAnnual = currentAnnual + oldAnnual;
    const effectiveLongLeave = currentLongLeave + oldLongLeave;
    const effectiveInhaldagen = currentInhaldagen + oldInhaldagen;

    const totalDays = annualDays + longLeaveDays + inhaldagenDays;

    if (!selectedDates || selectedDates.length === 0) {
      return {
        success: false,
        message: "Silakan pilih minimal 1 tanggal cuti di kalender.",
      };
    }

    if (totalDays !== selectedDates.length) {
      return {
        success: false,
        message: `Total alokasi cuti (${totalDays} hari) tidak sama dengan jumlah tanggal yang dipilih (${selectedDates.length} hari).`,
      };
    }

    if (annualDays > effectiveAnnual) {
      return {
        success: false,
        message: `Alokasi Cuti Tahunan melebihi batas yang tersedia. (Diminta: ${annualDays} hari, Tersedia: ${effectiveAnnual} hari)`,
      };
    }

    if (longLeaveDays > effectiveLongLeave) {
      return {
        success: false,
        message: `Alokasi Cuti Besar melebihi batas yang tersedia. (Diminta: ${longLeaveDays} hari, Tersedia: ${effectiveLongLeave} hari)`,
      };
    }

    if (inhaldagenDays > effectiveInhaldagen) {
      return {
        success: false,
        message: `Alokasi Inhaldagen melebihi batas yang tersedia. (Diminta: ${inhaldagenDays} hari, Tersedia: ${effectiveInhaldagen} hari)`,
      };
    }

    // Hitung saldo baru
    const newAnnual = effectiveAnnual - annualDays;
    const newLongLeave = effectiveLongLeave - longLeaveDays;
    const newInhaldagen = effectiveInhaldagen - inhaldagenDays;
    const newTotal = newAnnual + newLongLeave + newInhaldagen;

    // Perbarui saldo_cuti
    await prisma.leaveBalance.upsert({
      where: { nip: employee.nip },
      create: {
        nip: employee.nip,
        nama: employee.nama,
        cutiTahunan: newAnnual,
        cutiBesar: newLongLeave,
        inhaldagen: newInhaldagen,
        total: newTotal,
        periode: new Date().getFullYear(),
      },
      update: {
        nama: employee.nama,
        cutiTahunan: newAnnual,
        cutiBesar: newLongLeave,
        inhaldagen: newInhaldagen,
        total: newTotal,
      },
    });

    // Format tanggal cuti baru
    const sortedDates = [...selectedDates].sort();
    const formattedDatesList = sortedDates
      .map((d) => {
        if (d.includes("/")) return d;
        const [y, m, day] = d.split("-");
        return `${day}/${m}/${y}`;
      })
      .join(", ");

    const typesList: string[] = [];
    if (annualDays > 0) typesList.push("Cuti Tahunan");
    if (longLeaveDays > 0) typesList.push("Cuti Besar");
    if (inhaldagenDays > 0) typesList.push("Inhaldagen");
    const uraianStr = `Pengambilan ${typesList.join(" & ") || "Cuti"}`;

    // Perbarui aktivitas_saldo via Prisma
    await prisma.balanceActivity.update({
      where: { id: activityId },
      data: {
        uraian: uraianStr,
        tglTransaksi: new Date(requestDate),
        tglCuti: formattedDatesList,
        cutiTahunan: annualDays,
        cutiBesar: longLeaveDays,
        inhaldagen: inhaldagenDays,
        totalHari: totalDays,
        keperluan: purpose || "-",
      },
    });

    // Audit log
    await logAudit({
      userId: user.id,
      action: "EDIT_LEAVE_REQUEST",
      entityType: "LEAVE_REQUEST",
      entityId: activityId,
      description: `Koreksi cuti ${employee.nama} (${employee.nip}): dari ${existing.totalHari} hari (${existing.tglCuti}) menjadi ${totalDays} hari (${formattedDatesList}).`,
      newValues: {
        previousTglCuti: existing.tglCuti,
        previousAnnual: existing.cutiTahunan,
        previousLongLeave: existing.cutiBesar,
        previousInhaldagen: existing.inhaldagen,
        previousTotalHari: existing.totalHari,
        tglCuti: formattedDatesList,
        cutiTahunan: annualDays,
        cutiBesar: longLeaveDays,
        inhaldagen: inhaldagenDays,
        totalHari: totalDays,
        updatedBalances: {
          annual: newAnnual,
          longLeave: newLongLeave,
          inhaldagen: newInhaldagen,
          total: newTotal,
        },
      },
    });

    return {
      success: true,
      message: `Koreksi permohonan cuti untuk ${employee.nama} berhasil disimpan!`,
      data: {
        updatedBalances: {
          annual: newAnnual,
          longLeave: newLongLeave,
          inhaldagen: newInhaldagen,
          total: newTotal,
        },
      },
    };
  } catch (error) {
    console.error("Update leave request correction error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat memperbarui permohonan cuti.",
    };
  }
}

export async function voidLeaveRequestAction(data: {
  leaveRequestId: string;
  reason?: string;
}): Promise<ActionResult<{ restoredDays: number; requestNumber: string }>> {
  const user = await requireAuth();

  if (!data.leaveRequestId) {
    return { success: false, message: "ID Permohonan cuti tidak valid." };
  }

  const voidReason = data.reason?.trim() || "Dibatalkan oleh Admin";

  try {
    const targetReq = await prisma.balanceActivity.findUnique({
      where: { id: data.leaveRequestId },
      include: {
        employee: {
          include: { leaveBalance: true },
        },
      },
    });

    if (!targetReq) {
      return { success: false, message: "Data permohonan cuti tidak ditemukan." };
    }

    const employee = targetReq.employee;
    if (!employee) {
      return { success: false, message: "Data karyawan tidak ditemukan di database." };
    }

    // Pemeriksaan hak akses Admin Bagian
    if (user.role === "ADMIN_BAGIAN" && user.department && user.department !== "ALL") {
      const userDept = user.department.toLowerCase();
      const empDept = employee.bagian.toLowerCase();
      if (!empDept.includes(userDept) && !userDept.includes(empDept)) {
        return {
          success: false,
          message: `Anda hanya memiliki hak akses untuk mengoreksi cuti karyawan bagian ${user.department}.`,
        };
      }
    }

    // Hitung kuota hari yang dipulihkan
    const annualDays = targetReq.cutiTahunan || 0;
    const longLeaveDays = targetReq.cutiBesar || 0;
    const inhaldagenDays = targetReq.inhaldagen || 0;
    const totalDaysToRestore = targetReq.totalHari || (annualDays + longLeaveDays + inhaldagenDays);

    // Kembalikan ke saldo cuti karyawan
    const currentAnnual = employee.leaveBalance?.cutiTahunan ?? 12;
    const currentLong = employee.leaveBalance?.cutiBesar ?? 0;
    const currentInhal = employee.leaveBalance?.inhaldagen ?? 0;

    const restoredAnnual = currentAnnual + annualDays;
    const restoredLong = currentLong + longLeaveDays;
    const restoredInhal = currentInhal + inhaldagenDays;
    const restoredTotal = restoredAnnual + restoredLong + restoredInhal;

    await prisma.leaveBalance.upsert({
      where: { nip: employee.nip },
      create: {
        nip: employee.nip,
        nama: employee.nama,
        cutiTahunan: restoredAnnual,
        cutiBesar: restoredLong,
        inhaldagen: restoredInhal,
        total: restoredTotal,
        periode: new Date().getFullYear(),
      },
      update: {
        cutiTahunan: restoredAnnual,
        cutiBesar: restoredLong,
        inhaldagen: restoredInhal,
        total: restoredTotal,
      },
    });

    // Hapus baris transaksi cuti dari aktivitas_saldo
    await prisma.balanceActivity.delete({
      where: { id: data.leaveRequestId },
    });

    const reqNumber = `REQ-${employee.nip}-${data.leaveRequestId.substring(0, 6)}`;

    // Log Audit
    await logAudit({
      userId: user.id,
      action: "VOID_LEAVE_REQUEST",
      entityType: "LEAVE_REQUEST",
      entityId: data.leaveRequestId,
      description: `Membatalkan/mengoreksi cuti No: ${reqNumber} untuk ${employee.nama} (NIP: ${employee.nip}). Saldo dipulihkan: ${totalDaysToRestore} hari. Alasan: ${voidReason}.`,
      oldValues: {
        requestNumber: reqNumber,
        employeeName: employee.nama,
        annualDays,
        longLeaveDays,
        inhaldagenDays,
        totalDays: totalDaysToRestore,
      },
      newValues: {
        status: "CANCELLED",
        restoredBalances: {
          annual: restoredAnnual,
          longLeave: restoredLong,
          inhaldagen: restoredInhal,
          total: restoredTotal,
        },
      },
    });

    return {
      success: true,
      message: `Permohonan cuti No: ${reqNumber} berhasil dibatalkan. Kuota ${totalDaysToRestore} hari telah dikembalikan ke saldo cuti ${employee.nama}.`,
      data: {
        restoredDays: totalDaysToRestore,
        requestNumber: reqNumber,
      },
    };
  } catch (error) {
    console.error("Void leave request error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat membatalkan permohonan cuti.",
    };
  }
}
