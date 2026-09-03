"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";
import { leaveRequestSchema, LeaveRequestInput } from "@/lib/validation/leave-schema";
import { getLeadersAction } from "@/actions/aksi-karyawan";
import type { ActionResult } from "@/types/actions";

export async function getEmployeesForLeaveAction() {
  const user = await requireAuth();

  try {
    const leadersRes = await getLeadersAction();
    let employees = (leadersRes.data || []).filter((e: any) => e.isActive !== false);

    // If user is Admin Bagian, filter only employees in their department
    if (user.role === "ADMIN_BAGIAN" && user.department && user.department !== "ALL") {
      const userDept = user.department.toLowerCase();
      employees = employees.filter((e: any) => {
        const deptName = (e.department?.name || "").toLowerCase();
        const deptCode = (e.department?.code || "").toLowerCase();
        return (
          deptName.includes(userDept) ||
          userDept.includes(deptName) ||
          deptCode === userDept
        );
      });
    }

    return {
      success: true,
      data: employees,
    };
  } catch (error) {
    console.error("getEmployeesForLeaveAction error:", error);
    return {
      success: false,
      message: "Gagal memuat data karyawan dari database.",
      data: [],
    };
  }
}

export async function getEmployeeBalanceAction(employeeId: string) {
  await requireAuth();

  try {
    const emp = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        station: true,
        leaveBalance: true,
      },
    });

    if (!emp) {
      return {
        success: false,
        message: "Data karyawan tidak ditemukan di database.",
      };
    }

    const isPelaksana = emp.category?.toUpperCase() === "PELAKSANA";
    const inhaldagenVal = isPelaksana ? 0 : (emp.leaveBalance?.inhaldagen ?? 0);
    const balances = emp.leaveBalance
      ? {
        annual: emp.leaveBalance.cutiTahunan,
        longLeave: emp.leaveBalance.cutiBesar,
        inhaldagen: inhaldagenVal,
        total: emp.leaveBalance.cutiTahunan + emp.leaveBalance.cutiBesar + inhaldagenVal,
      }
      : {
        annual: 12,
        longLeave: 0,
        inhaldagen: 0,
        total: 12,
      };

    return {
      success: true,
      data: {
        employee: {
          id: emp.id,
          employeeNumber: emp.nip,
          name: emp.nama,
          position: emp.jabatan,
          category: emp.category,
          department: {
            id: emp.bagian,
            code: "-",
            name: emp.bagian,
          },
          stasiun: emp.stasiun || emp.station?.name || "-",
          balances,
        },
        balances,
      },
    };
  } catch (error) {
    console.error("getEmployeeBalanceAction error:", error);
    return {
      success: false,
      message: "Gagal mengambil saldo cuti dari database.",
    };
  }
}

export async function createLeaveRequestAction(
  data: LeaveRequestInput
): Promise<ActionResult<{ leaveRequestId: string }>> {
  const user = await requireAuth();

  const validation = leaveRequestSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: "Validasi formulir gagal. Mohon periksa kembali isian Anda.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const {
    employeeId,
    requestDate,
    selectedDates,
    startDate,
    endDate,
    annualDays,
    longLeaveDays,
    inhaldagenDays,
    purpose,
    notes,
  } = validation.data;

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { leaveBalance: true },
    });

    if (!employee || !employee.isActive) {
      return {
        success: false,
        message: "Data karyawan tidak valid atau sedang tidak aktif di database.",
      };
    }

    // Role check: If Admin Bagian, ensure employee is in their department
    if (user.role === "ADMIN_BAGIAN" && user.department && user.department !== "ALL") {
      const userDept = user.department.toLowerCase();
      const empDept = employee.bagian.toLowerCase();
      if (!empDept.includes(userDept) && !userDept.includes(empDept)) {
        return {
          success: false,
          message: `Anda hanya memiliki hak akses untuk menginput cuti karyawan ${user.department}.`,
        };
      }
    }

    const currentAnnual = employee.leaveBalance?.cutiTahunan ?? 12;
    const currentLongLeave = employee.leaveBalance?.cutiBesar ?? 0;
    const currentInhaldagen = employee.leaveBalance?.inhaldagen ?? 0;

    // Balance check
    if (annualDays > currentAnnual) {
      return {
        success: false,
        message: `Saldo Cuti Tahunan tidak mencukupi. (Diminta: ${annualDays} hari, Saldo: ${currentAnnual} hari)`,
      };
    }
    if (longLeaveDays > currentLongLeave) {
      return {
        success: false,
        message: `Saldo Cuti Besar tidak mencukupi. (Diminta: ${longLeaveDays} hari, Saldo: ${currentLongLeave} hari)`,
      };
    }
    if (inhaldagenDays > currentInhaldagen) {
      return {
        success: false,
        message: `Saldo Inhaldagen tidak mencukupi. (Diminta: ${inhaldagenDays} hari, Saldo: ${currentInhaldagen} hari)`,
      };
    }

    const newAnnual = currentAnnual - annualDays;
    const newLongLeave = currentLongLeave - longLeaveDays;
    const newInhaldagen = currentInhaldagen - inhaldagenDays;
    const newTotal = newAnnual + newLongLeave + newInhaldagen;

    // Update MySQL saldo_cuti table
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

    const totalDays = annualDays + longLeaveDays + inhaldagenDays;
    const now = new Date();
    const requestNumber = `CT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const reqId = `req-${Date.now()}`;

    // Compute effective dates from selectedDates
    const sortedDates = [...(selectedDates || [])].sort();
    const effectiveStartDate = startDate || sortedDates[0] || requestDate;
    const effectiveEndDate = endDate || sortedDates[sortedDates.length - 1] || effectiveStartDate;
    const formattedDatesList = sortedDates
      .map((d) => {
        const [y, m, day] = d.split("-");
        return `${day}/${m}/${y}`;
      })
      .join(", ");

    const dateDetailNote = formattedDatesList ? `Tgl: ${formattedDatesList}` : "";
    const combinedNotes = [notes, dateDetailNote].filter(Boolean).join(" • ");

    const typesList: string[] = [];
    if (annualDays > 0) typesList.push("Cuti Tahunan");
    if (longLeaveDays > 0) typesList.push("Cuti Besar");
    if (inhaldagenDays > 0) typesList.push("Inhaldagen");
    const uraianStr = `Pengambilan ${typesList.join(" & ") || "Cuti"}`;

    // Simpan langsung ke tabel MySQL `aktivitas_saldo`
    try {
      await prisma.$executeRaw`
        INSERT INTO aktivitas_saldo (
          id, nip, nama, jenis_transaksi, uraian, tgl_transaksi, tgl_cuti, cuti_tahunan, cuti_besar, inhaldagen, total_hari, keperluan, created_at, updated_at
        ) VALUES (
          ${reqId}, ${employee.nip}, ${employee.nama}, 'AMBIL_CUTI', ${uraianStr}, ${new Date(requestDate)}, ${formattedDatesList || effectiveStartDate}, 
          ${annualDays}, ${longLeaveDays}, ${inhaldagenDays}, ${totalDays}, ${purpose || "-"}, NOW(), NOW()
        )
      `;
    } catch (dbErr) {
      console.error("Gagal simpan ke tabel aktivitas_saldo:", dbErr);
    }

    // Log Audit
    await logAudit({
      userId: user.id,
      action: "CREATE_LEAVE_REQUEST",
      entityType: "LEAVE_REQUEST",
      entityId: reqId,
      description: `Pengambilan cuti ${employee.nama} (${employee.nip}) sebanyak ${totalDays} hari (${formattedDatesList || "1 hari"}).`,
      newValues: {
        employeeName: employee.nama,
        totalDays,
        selectedDates: sortedDates,
        formattedDates: formattedDatesList,
        annualDays,
        longLeaveDays,
        inhaldagenDays,
      },
    });

    return {
      success: true,
      message: "Permohonan cuti berhasil disimpan!",
      data: {
        leaveRequestId: reqId,
      },
    };
  } catch (error) {
    console.error("Create leave request error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memproses permohonan cuti di database.",
    };
  }
}

export interface EmployeeLeaveHistoryItem {
  id: string;
  requestNumber: string;
  employeeId: string;
  transactionType?: "AMBIL_CUTI" | "TAMBAH_SALDO";
  uraian?: string;
  requestDate: string;
  startDate: string;
  endDate: string;
  selectedDates?: string[];
  totalDays: number;
  annualDays: number;
  longLeaveDays: number;
  inhaldagenDays: number;
  purpose: string;
  notes: string | null;
  status: "APPROVED" | "CANCELLED" | "PENDING";
  createdByName: string;
  createdAt: string;
}

export async function getEmployeeLeaveRequestsAction(
  employeeId: string
): Promise<ActionResult<EmployeeLeaveHistoryItem[]>> {
  await requireAuth();

  try {
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [{ id: employeeId }, { nip: employeeId }],
      },
    });

    if (employee) {
      try {
        const rows: any[] = await prisma.$queryRaw`
          SELECT id, nip, nama, jenis_transaksi, uraian, tgl_transaksi, tgl_cuti, cuti_tahunan, cuti_besar, inhaldagen, total_hari, keperluan, created_at
          FROM aktivitas_saldo
          WHERE nip = ${employee.nip}
          ORDER BY created_at ASC
        `;

        if (rows && rows.length > 0) {
          const items: EmployeeLeaveHistoryItem[] = rows.map((r) => {
            const datesList = r.tgl_cuti ? r.tgl_cuti.split(", ").map((s: string) => s.trim()) : [];
            const reqDate = r.tgl_transaksi ? new Date(r.tgl_transaksi) : new Date(r.created_at);
            const isTambah = r.jenis_transaksi === "TAMBAH_SALDO";

            const types: string[] = [];
            if (Number(r.cuti_tahunan) > 0) types.push("Cuti Tahunan");
            if (Number(r.cuti_besar) > 0) types.push("Cuti Besar");
            if (Number(r.inhaldagen) > 0) types.push("Inhaldagen");
            const fallbackUraian = isTambah 
              ? `Penambahan Saldo ${types.join(" & ") || "Cuti"}`
              : `Pengambilan ${types.join(" & ") || "Cuti"}`;

            const computedUraian = (r.uraian && String(r.uraian).trim() !== "") ? r.uraian : fallbackUraian;

            return {
              id: r.id,
              requestNumber: `CT-${r.nip}`,
              employeeId: employee.id,
              transactionType: (r.jenis_transaksi as "AMBIL_CUTI" | "TAMBAH_SALDO") || "AMBIL_CUTI",
              uraian: computedUraian,
              requestDate: reqDate.toISOString(),
              startDate: reqDate.toISOString(),
              endDate: reqDate.toISOString(),
              selectedDates: datesList,
              totalDays: Number(r.total_hari) || (Number(r.cuti_tahunan) + Number(r.cuti_besar) + Number(r.inhaldagen)),
              annualDays: Number(r.cuti_tahunan) || 0,
              longLeaveDays: Number(r.cuti_besar) || 0,
              inhaldagenDays: Number(r.inhaldagen) || 0,
              purpose: r.keperluan || (isTambah ? "Penambahan Saldo" : "-"),
              notes: null,
              status: "APPROVED",
              createdByName: "Admin",
              createdAt: new Date(r.created_at).toISOString(),
            };
          });

          return {
            success: true,
            data: items,
          };
        }
      } catch (sqlErr) {
        console.error("Querying aktivitas_saldo error:", sqlErr);
      }
    }

    return {
      success: true,
      data: [],
    };
  } catch (error) {
    console.error("Get employee leave requests error:", error);
    return {
      success: false,
      message: "Gagal memuat riwayat cuti karyawan.",
      data: [],
    };
  }
}

export async function getEmployeeTransactionsAction(employeeId: string) {
  await requireAuth();

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return {
        success: false,
        message: "Karyawan tidak ditemukan di database.",
      };
    }

    let transactions: Record<string, unknown>[] = [];
    try {
      transactions = await prisma.$queryRaw`
        SELECT id, nip, nama, jenis_transaksi, uraian, tgl_transaksi, 
               cuti_tahunan, cuti_besar, inhaldagen, total_hari, keperluan, created_at
        FROM aktivitas_saldo
        WHERE nip = ${employee.nip}
        ORDER BY tgl_transaksi DESC, created_at DESC
      `;
    } catch (sqlErr) {
      console.error("Querying transactions error:", sqlErr);
    }

    return {
      success: true,
      data: {
        employee: {
          id: employee.id,
          employeeNumber: employee.nip,
          name: employee.nama,
          department: { name: employee.bagian },
        },
        transactions,
      },
    };
  } catch (error) {
    console.error("Get transactions error:", error);
    return {
      success: false,
      message: "Gagal mengambil riwayat transaksi cuti.",
    };
  }
}

export interface CorrectLeaveRequestInput {
  activityId: string;
  employeeId: string;
  requestDate: string;
  startDate?: string;
  endDate?: string;
  selectedDates: string[];
  annualDays: number;
  longLeaveDays: number;
  inhaldagenDays: number;
  purpose: string;
  notes?: string;
}

export async function correctLeaveRequestAction(
  input: CorrectLeaveRequestInput
): Promise<ActionResult<{ success: boolean; message: string; updatedBalances: { annual: number; longLeave: number; inhaldagen: number; total: number } }>> {
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

    // Fetch employee & leave balance from MySQL
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
        message: "Karyawan tidak ditemukan di database.",
      };
    }

    // Fetch existing activity from MySQL aktivitas_saldo
    const existingRows: any[] = await prisma.$queryRaw`
      SELECT * FROM aktivitas_saldo WHERE id = ${activityId} AND nip = ${employee.nip}
    `;

    if (!existingRows || existingRows.length === 0) {
      return {
        success: false,
        message: "Data transaksi cuti yang ingin dikoreksi tidak ditemukan.",
      };
    }

    const existing = existingRows[0];
    if (existing.jenis_transaksi !== "AMBIL_CUTI") {
      return {
        success: false,
        message: "Hanya transaksi pengambilan cuti yang dapat dikoreksi melalui form ini.",
      };
    }

    // Previous deductions of this record
    const oldAnnual = Number(existing.cuti_tahunan) || 0;
    const oldLongLeave = Number(existing.cuti_besar) || 0;
    const oldInhaldagen = Number(existing.inhaldagen) || 0;

    // Current balances
    const balanceRecord = employee.leaveBalance;
    const currentAnnual = balanceRecord?.cutiTahunan ?? 0;
    const currentLongLeave = balanceRecord?.cutiBesar ?? 0;
    const currentInhaldagen = balanceRecord?.inhaldagen ?? 0;

    // Effective balances before this new deduction (current + refund of old)
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

    // Calculate new balance
    const newAnnual = effectiveAnnual - annualDays;
    const newLongLeave = effectiveLongLeave - longLeaveDays;
    const newInhaldagen = effectiveInhaldagen - inhaldagenDays;
    const newTotal = newAnnual + newLongLeave + newInhaldagen;

    // Update MySQL saldo_cuti
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

    // Format new selectedDates
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

    // Update MySQL aktivitas_saldo
    await prisma.$executeRaw`
      UPDATE aktivitas_saldo
      SET
        uraian = ${uraianStr},
        tgl_transaksi = ${new Date(requestDate)},
        tgl_cuti = ${formattedDatesList},
        cuti_tahunan = ${annualDays},
        cuti_besar = ${longLeaveDays},
        inhaldagen = ${inhaldagenDays},
        total_hari = ${totalDays},
        keperluan = ${purpose || "-"},
        updated_at = NOW()
      WHERE id = ${activityId}
    `;

    // Audit log
    await logAudit({
      userId: user.id,
      action: "EDIT_LEAVE_REQUEST",
      entityType: "LEAVE_REQUEST",
      entityId: activityId,
      description: `Koreksi cuti ${employee.nama} (${employee.nip}): dari ${existing.total_hari} hari (${existing.tgl_cuti}) menjadi ${totalDays} hari (${formattedDatesList}).`,
      newValues: {
        previousTglCuti: existing.tgl_cuti,
        previousAnnual: existing.cuti_tahunan,
        previousLongLeave: existing.cuti_besar,
        previousInhaldagen: existing.inhaldagen,
        previousTotalHari: existing.total_hari,
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
      message: "Koreksi permohonan cuti berhasil disimpan. Saldo cuti telah disesuaikan.",
      data: {
        success: true,
        message: "Berhasil",
        updatedBalances: {
          annual: newAnnual,
          longLeave: newLongLeave,
          inhaldagen: newInhaldagen,
          total: newTotal,
        },
      },
    };
  } catch (error) {
    console.error("Correct leave request error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memproses koreksi cuti di database.",
    };
  }
}

export interface EmployeeOnLeaveToday {
  id: string;
  nip: string;
  nama: string;
  bagian: string;
  stasiun: string;
  category: string;
  jabatan: string;
  tglCuti: string;
  cutiTahunan: number;
  cutiBesar: number;
  inhaldagen: number;
  totalHari: number;
  keperluan: string;
  employeeId?: string;
}

export async function getEmployeesOnLeaveTodayAction(): Promise<ActionResult<EmployeeOnLeaveToday[]>> {
  const user = await requireAuth();

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const d2 = pad(now.getDate());
  const m2 = pad(now.getMonth() + 1);
  const y4 = now.getFullYear();

  const todayDMY = `${d2}/${m2}/${y4}`;
  const todayDMYShort = `${now.getDate()}/${now.getMonth() + 1}/${y4}`;
  const todayYMD = `${y4}-${m2}-${d2}`;
  const searchFormats = [todayDMY, todayDMYShort, todayYMD];

  try {
    const rawCutiHariIni = await prisma.balanceActivity.findMany({
      where: {
        jenisTransaksi: "AMBIL_CUTI",
        OR: searchFormats.map((tf) => ({
          tglCuti: { contains: tf },
        })),
      },
      include: {
        employee: true,
      },
      orderBy: {
        tglTransaksi: "desc",
      },
    });

    const filtered = rawCutiHariIni.filter((row) => {
      const dates = (row.tglCuti || "").split(",").map((s) => s.trim());
      const isToday = dates.some((d) => searchFormats.includes(d));
      if (!isToday) return false;

      if (user.role === "ADMIN_BAGIAN" && user.department && user.department !== "ALL") {
        const empDept = (row.employee?.bagian || "").toLowerCase();
        const userDept = user.department.toLowerCase();
        return empDept.includes(userDept) || userDept.includes(empDept);
      }
      return true;
    });

    const data: EmployeeOnLeaveToday[] = filtered.map((row) => ({
      id: row.id,
      nip: row.nip,
      nama: row.employee?.nama || row.nama || "Karyawan",
      bagian: row.employee?.bagian || "-",
      stasiun: row.employee?.stasiun || "-",
      category: row.employee?.category || "PIMPINAN",
      jabatan: row.employee?.jabatan || "-",
      tglCuti: row.tglCuti || todayDMY,
      cutiTahunan: row.cutiTahunan,
      cutiBesar: row.cutiBesar,
      inhaldagen: row.inhaldagen,
      totalHari: row.totalHari,
      keperluan: row.keperluan || row.uraian || "-",
      employeeId: row.employee?.id,
    }));

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("getEmployeesOnLeaveTodayAction error:", error);
    return {
      success: false,
      message: "Gagal memuat data karyawan yang sedang cuti.",
      data: [],
    };
  }
}

