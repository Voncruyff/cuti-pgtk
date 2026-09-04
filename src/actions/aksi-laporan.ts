"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { getAllowedDepartmentNames, isDepartmentMatch } from "@/lib/auth/department-checker";

export interface EmployeeBalanceReportItem {
  id: string;
  nip: string;
  nama: string;
  jabatan: string;
  bagian: string;
  stasiun: string;
  kategori: string;
  cutiTahunan: number;
  cutiBesar: number;
  inhaldagen: number;
  totalSaldo: number;
  periode: number;
}

export interface LeaveUsageReportItem {
  id: string;
  nip: string;
  nama: string;
  bagian: string;
  stasiun: string;
  kategori: string;
  jabatan: string;
  tglTransaksi: string;
  requestDate: string;
  uraian: string;
  tglCuti: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  annualDays: number;
  longLeaveDays: number;
  inhaldagenDays: number;
  purpose: string;
  status: string;
}

export async function getLeaveBalanceReportAction(params?: {
  department?: string;
  year?: number;
}) {
  const user = await requireAuth();

  try {
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: {
        station: true,
        leaveBalance: true,
      },
      orderBy: [{ nip: "asc" }],
    });

    let items: EmployeeBalanceReportItem[] = employees.map((emp) => {
      const isPelaksana = emp.category?.toUpperCase() === "PELAKSANA";
      const bal = emp.leaveBalance;
      const cutiTahunan = bal?.cutiTahunan ?? 12;
      const cutiBesar = bal?.cutiBesar ?? 0;
      const inhaldagen = isPelaksana ? 0 : (bal?.inhaldagen ?? 0);
      const totalSaldo = cutiTahunan + cutiBesar + inhaldagen;

      return {
        id: emp.id,
        nip: emp.nip,
        nama: emp.nama,
        jabatan: emp.jabatan,
        bagian: emp.bagian,
        stasiun: emp.stasiun || emp.station?.name || "-",
        kategori: isPelaksana ? "PELAKSANA" : "PIMPINAN",
        cutiTahunan,
        cutiBesar,
        inhaldagen,
        totalSaldo,
        periode: bal?.periode ?? new Date().getFullYear(),
      };
    });

    // Filter by department if Admin Bagian
    if (user.role === "ADMIN_BAGIAN" && user.department && user.department !== "ALL") {
      const allowedNames = await getAllowedDepartmentNames(user.department);
      items = items.filter((item) => isDepartmentMatch(item.bagian, allowedNames));
    } else if (params?.department && params.department !== "ALL") {
      const filterDept = params.department.toLowerCase();
      items = items.filter((item) => {
        const itemDept = item.bagian.toLowerCase();
        return itemDept.includes(filterDept) || filterDept.includes(itemDept);
      });
    }

    // Summary calculations
    const summary = {
      totalEmployees: items.length,
      totalAnnual: items.reduce((acc, curr) => acc + curr.cutiTahunan, 0),
      totalLongLeave: items.reduce((acc, curr) => acc + curr.cutiBesar, 0),
      totalInhaldagen: items.reduce((acc, curr) => acc + curr.inhaldagen, 0),
      totalCombined: items.reduce((acc, curr) => acc + curr.totalSaldo, 0),
    };

    return {
      success: true,
      data: {
        items,
        summary,
        generatedAt: new Date().toISOString(),
        generatedBy: user.fullName || user.username,
      },
    };
  } catch (error) {
    console.error("getLeaveBalanceReportAction error:", error);
    return {
      success: false,
      message: "Gagal mengambil data laporan saldo cuti.",
      data: {
        items: [],
        summary: {
          totalEmployees: 0,
          totalAnnual: 0,
          totalLongLeave: 0,
          totalInhaldagen: 0,
          totalCombined: 0,
        },
        generatedAt: new Date().toISOString(),
        generatedBy: "-",
      },
    };
  }
}

export async function getLeaveUsageReportAction(params?: {
  year?: number;
  month?: number;
  department?: string;
}) {
  const user = await requireAuth();

  try {
    let rows: any[] = [];
    try {
      rows = await prisma.$queryRaw`
        SELECT a.id, a.nip, a.nama, a.jenis_transaksi, a.uraian, a.tgl_transaksi, a.tgl_cuti, 
               a.cuti_tahunan, a.cuti_besar, a.inhaldagen, a.total_hari, a.keperluan, a.created_at,
               k.bagian, k.stasiun, k.category, k.jabatan
        FROM aktivitas_saldo a
        LEFT JOIN karyawan k ON a.nip = k.nip
        WHERE a.jenis_transaksi = 'AMBIL_CUTI'
        ORDER BY a.tgl_transaksi DESC
      `;
    } catch {
      // Fallback jika menggunakan prisma client accessor
      if ((prisma as any).balanceActivity) {
        const res = await (prisma as any).balanceActivity.findMany({
          where: { jenisTransaksi: "AMBIL_CUTI" },
          include: { employee: { include: { station: true } } },
          orderBy: { tglTransaksi: "desc" },
        });
        rows = res.map((r: any) => ({
          ...r,
          bagian: r.employee?.bagian || "-",
          stasiun: r.employee?.stasiun || r.employee?.station?.name || "-",
          category: r.employee?.category || "PIMPINAN",
          jabatan: r.employee?.jabatan || "-",
        }));
      }
    }

    let items: LeaveUsageReportItem[] = rows.map((act: any) => {
      const tglCutiArr = act.tgl_cuti ? String(act.tgl_cuti).split(", ") : (act.tglCuti ? String(act.tglCuti).split(", ") : []);
      const txDate = act.tgl_transaksi ? new Date(act.tgl_transaksi) : (act.tglTransaksi ? new Date(act.tglTransaksi) : new Date());
      const txDateStr = txDate.toISOString();
      const startDate = tglCutiArr.length > 0 ? tglCutiArr[0] : txDateStr;
      const endDate = tglCutiArr.length > 0 ? tglCutiArr[tglCutiArr.length - 1] : startDate;

      return {
        id: act.id,
        nip: act.nip,
        nama: act.nama || "Karyawan",
        bagian: act.bagian || "-",
        stasiun: act.stasiun || "-",
        kategori: String(act.category || "").toUpperCase() === "PELAKSANA" ? "PELAKSANA" : "PIMPINAN",
        jabatan: act.jabatan || "-",
        tglTransaksi: txDateStr,
        requestDate: txDateStr,
        uraian: act.uraian || act.keperluan || "Pengambilan Cuti",
        tglCuti: act.tgl_cuti || act.tglCuti || "",
        startDate,
        endDate,
        totalDays: Number(act.total_hari ?? act.totalHari ?? 0),
        annualDays: Number(act.cuti_tahunan ?? act.cutiTahunan ?? 0),
        longLeaveDays: Number(act.cuti_besar ?? act.cutiBesar ?? 0),
        inhaldagenDays: Number(act.inhaldagen ?? 0),
        purpose: act.keperluan || act.uraian || "-",
        status: "APPROVED",
      };
    });

    // Filter by year if specified
    if (params?.year) {
      items = items.filter((item) => {
        const itemYear = new Date(item.requestDate).getFullYear();
        return itemYear === params.year;
      });
    }

    // Filter by month if specified (1-12)
    if (params?.month && params.month > 0) {
      items = items.filter((item) => {
        const itemMonth = new Date(item.requestDate).getMonth() + 1;
        return itemMonth === params.month;
      });
    }

    // Filter by department if Admin Bagian
    if (user.role === "ADMIN_BAGIAN" && user.department && user.department !== "ALL") {
      const allowedNames = await getAllowedDepartmentNames(user.department);
      items = items.filter((item) => isDepartmentMatch(item.bagian, allowedNames));
    } else if (params?.department && params.department !== "ALL") {
      const filterDept = params.department.toLowerCase();
      items = items.filter((item) => {
        const itemDept = item.bagian.toLowerCase();
        return itemDept.includes(filterDept) || filterDept.includes(itemDept);
      });
    }

    // Summary calculations
    const approvedItems = items.filter((i) => i.status === "APPROVED");
    const summary = {
      totalTransactions: items.length,
      approvedTransactions: approvedItems.length,
      totalDaysUsed: approvedItems.reduce((acc, curr) => acc + curr.totalDays, 0),
      totalAnnualDays: approvedItems.reduce((acc, curr) => acc + curr.annualDays, 0),
      totalLongLeaveDays: approvedItems.reduce((acc, curr) => acc + curr.longLeaveDays, 0),
      totalInhaldagenDays: approvedItems.reduce((acc, curr) => acc + curr.inhaldagenDays, 0),
    };

    return {
      success: true,
      data: {
        items,
        summary,
        generatedAt: new Date().toISOString(),
        generatedBy: user.fullName || user.username,
      },
    };
  } catch (error) {
    console.error("getLeaveUsageReportAction error:", error);
    return {
      success: false,
      message: "Gagal mengambil data laporan pemakaian cuti.",
      data: {
        items: [],
        summary: {
          totalTransactions: 0,
          approvedTransactions: 0,
          totalDaysUsed: 0,
          totalAnnualDays: 0,
          totalLongLeaveDays: 0,
          totalInhaldagenDays: 0,
        },
        generatedAt: new Date().toISOString(),
        generatedBy: "-",
      },
    };
  }
}
