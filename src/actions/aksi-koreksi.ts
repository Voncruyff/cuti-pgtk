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
}

export async function getLeaveRequestsForCorrectionAction(params?: {
  search?: string;
  department?: string;
  status?: string;
}) {
  const user = await requireAuth();

  try {
    const rows: Record<string, unknown>[] = await prisma.$queryRaw`
      SELECT a.id, a.nip, a.nama, a.jenis_transaksi, a.uraian, a.tgl_transaksi, a.tgl_cuti,
             a.cuti_tahunan, a.cuti_besar, a.inhaldagen, a.total_hari, a.keperluan, a.created_at,
             k.id as employee_id, k.bagian, k.stasiun, k.category, k.jabatan
      FROM aktivitas_saldo a
      LEFT JOIN karyawan k ON a.nip = k.nip
      WHERE a.jenis_transaksi = 'AMBIL_CUTI'
      ORDER BY a.tgl_transaksi DESC, a.created_at DESC
    `;

    let items: LeaveRequestCorrectionItem[] = rows.map((r) => {
      const totalDays = Number(r.total_hari || 0);
      const annualDays = Number(r.cuti_tahunan || 0);
      const longLeaveDays = Number(r.cuti_besar || 0);
      const inhaldagenDays = Number(r.inhaldagen || 0);
      const tglCutiStr = String(r.tgl_cuti || "");
      const datesList = tglCutiStr ? tglCutiStr.split(", ").map((s) => s.trim()) : [];
      const txDate = r.tgl_transaksi || r.created_at || new Date();

      return {
        id: String(r.id),
        requestNumber: `REQ-${String(r.nip)}-${new Date(String(txDate)).getTime()}`,
        employeeId: String(r.employee_id || r.nip),
        employeeName: String(r.nama || "Karyawan"),
        employeeNumber: String(r.nip),
        department: String(r.bagian || "-"),
        station: String(r.stasiun || "-"),
        category: String(r.category || "PIMPINAN"),
        requestDate: new Date(String(txDate)).toISOString(),
        startDate: datesList[0] ? new Date(datesList[0]).toISOString() : new Date(String(txDate)).toISOString(),
        endDate: datesList[datesList.length - 1] ? new Date(datesList[datesList.length - 1]).toISOString() : new Date(String(txDate)).toISOString(),
        selectedDates: datesList,
        totalDays: totalDays || (annualDays + longLeaveDays + inhaldagenDays) || 1,
        annualDays,
        longLeaveDays,
        inhaldagenDays,
        purpose: String(r.keperluan || r.uraian || "Pengambilan Cuti"),
        notes: String(r.uraian || ""),
        status: "APPROVED",
        createdByName: "Admin",
        createdAt: new Date(String(r.created_at || txDate)).toISOString(),
      };
    });

    // Role Filtering
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
          item.department.toLowerCase().includes(q)
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

export async function voidLeaveRequestAction(data: {
  leaveRequestId: string;
  reason: string;
}): Promise<ActionResult<{ restoredDays: number; requestNumber: string }>> {
  const user = await requireAuth();

  if (!data.leaveRequestId) {
    return { success: false, message: "ID Permohonan cuti tidak valid." };
  }

  if (!data.reason || data.reason.trim().length < 3) {
    return { success: false, message: "Alasan pembatalan/koreksi minimal 3 karakter." };
  }

  try {
    const rows: Record<string, unknown>[] = await prisma.$queryRaw`
      SELECT * FROM aktivitas_saldo WHERE id = ${data.leaveRequestId} LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      return { success: false, message: "Data permohonan cuti tidak ditemukan." };
    }

    const targetReq = rows[0];
    const nip = String(targetReq.nip);

    // Fetch employee from database
    const employee = await prisma.employee.findUnique({
      where: { nip },
      include: { leaveBalance: true },
    });

    if (!employee) {
      return { success: false, message: "Data karyawan tidak ditemukan di database." };
    }

    // Role check
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

    // Calculate days to restore
    const annualDays = Number(targetReq.cuti_tahunan || 0);
    const longLeaveDays = Number(targetReq.cuti_besar || 0);
    const inhaldagenDays = Number(targetReq.inhaldagen || 0);
    const totalDaysToRestore = Number(targetReq.total_hari || (annualDays + longLeaveDays + inhaldagenDays));

    // Update employee balance in database (+ restore days)
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

    // Delete record from aktivitas_saldo
    await prisma.$executeRaw`
      DELETE FROM aktivitas_saldo WHERE id = ${data.leaveRequestId}
    `;

    const reqNumber = `REQ-${nip}-${data.leaveRequestId.substring(0, 6)}`;

    // Log Audit
    await logAudit({
      userId: user.id,
      action: "VOID_LEAVE_REQUEST",
      entityType: "LEAVE_REQUEST",
      entityId: data.leaveRequestId,
      description: `Membatalkan/mengoreksi cuti No: ${reqNumber} untuk ${employee.nama} (NIP: ${employee.nip}). Saldo dipulihkan: ${totalDaysToRestore} hari. Alasan: ${data.reason.trim()}.`,
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
