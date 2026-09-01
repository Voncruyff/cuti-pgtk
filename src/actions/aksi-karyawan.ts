"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";
import { ActionResult } from "@/actions/leave-actions";
import { z } from "zod";

const leaderSchema = z.object({
  employeeNumber: z.string().min(1, "NIP wajib diisi"),
  name: z.string().min(1, "Nama karyawan wajib diisi"),
  position: z.string().optional().default("-"),
  departmentId: z.string().min(1, "Bagian wajib dipilih"),
  category: z.enum(["PIMPINAN", "PELAKSANA"]).default("PIMPINAN"),
  stationId: z.string().optional().nullable(),
  stasiun: z.string().optional().nullable(),
  appointmentDate: z.string().optional().nullable(),
  initialAnnual: z.coerce.number().min(0).default(0),
  initialLongLeave: z.coerce.number().min(0).default(0),
  initialInhaldagen: z.coerce.number().min(0).default(0),
});

export type LeaderInput = z.infer<typeof leaderSchema>;

export async function getLeadersAction() {
  await requireAuth();

  try {
    // Jalankan semua query DB secara paralel
    const [dbEmployees, departments, stations] = await Promise.all([
      prisma.employee.findMany({
        include: {
          station: true,
          leaveBalance: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.department.findMany({
        select: { id: true, name: true, code: true },
      }),
      prisma.station.findMany({
        select: { id: true, name: true, code: true },
      }),
    ]);

    // Map each DB employee for leave ledger calculations
    const result = dbEmployees.map((emp) => {
      const dept = departments.find(
        (d) =>
          d.id === emp.bagian ||
          d.name.toLowerCase() === emp.bagian.toLowerCase() ||
          d.code.toLowerCase() === emp.bagian.toLowerCase() ||
          d.name.toLowerCase().includes(emp.bagian.toLowerCase()) ||
          emp.bagian.toLowerCase().includes(d.name.toLowerCase())
      );

      // Station resolution: either from relation or match by name
      const matchedStation =
        emp.station ||
        stations.find(
          (s) =>
            s.id === emp.stationId ||
            s.name.toLowerCase() === (emp.stasiun || "").toLowerCase()
        );

      const resolvedCategory = emp.category || "PIMPINAN";
      const resolvedStationName = emp.stasiun || matchedStation?.name || "-";
      const resolvedStationId = emp.stationId || matchedStation?.id || null;

      const isPelaksana = resolvedCategory === "PELAKSANA";
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
        id: emp.id,
        employeeNumber: emp.nip,
        name: emp.nama,
        position: emp.jabatan || "-",
        category: resolvedCategory,
        departmentId: dept?.id || emp.bagian,
        department: {
          id: dept?.id || emp.bagian,
          code: dept?.code || "-",
          name: dept?.name || emp.bagian || "-",
        },
        stationId: resolvedStationId,
        stasiun: resolvedStationName,
        stationCode: matchedStation?.code || "-",
        appointmentDate: (emp as { appointmentDate?: Date | null }).appointmentDate
          ? (emp as { appointmentDate?: Date | null }).appointmentDate!.toISOString()
      : null,
        balances,
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Get leaders error:", error);
    return {
      success: false,
      data: [],
    };
  }
}

export async function getEmployeePageDataAction() {
  await requireAuth();

  try {
    const [dbEmployees, departments, allStations] = await Promise.all([
      prisma.employee.findMany({
        include: { station: true, leaveBalance: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.department.findMany({
        where: { isActive: true },
        orderBy: { code: "asc" },
      }),
      prisma.station.findMany({
        include: { department: true },
        orderBy: { code: "asc" },
      }),
    ]);

    const employees = dbEmployees.map((emp) => {
      const dept = departments.find(
        (d) =>
          d.id === emp.bagian ||
          d.name.toLowerCase() === emp.bagian.toLowerCase() ||
          d.code.toLowerCase() === emp.bagian.toLowerCase() ||
          d.name.toLowerCase().includes(emp.bagian.toLowerCase()) ||
          emp.bagian.toLowerCase().includes(d.name.toLowerCase())
      );
      const matchedStation =
        emp.station ||
        allStations.find(
          (s) => s.id === emp.stationId || s.name.toLowerCase() === (emp.stasiun || "").toLowerCase()
        );
      const resolvedCategory = emp.category || "PIMPINAN";
      const resolvedStationName = emp.stasiun || matchedStation?.name || "-";
      const resolvedStationId = emp.stationId || matchedStation?.id || null;

      const isPelaksana = resolvedCategory === "PELAKSANA";
      const inhaldagenVal = isPelaksana ? 0 : (emp.leaveBalance?.inhaldagen ?? 0);
      const balances = emp.leaveBalance
        ? {
            annual: emp.leaveBalance.cutiTahunan,
            longLeave: emp.leaveBalance.cutiBesar,
            inhaldagen: inhaldagenVal,
            total: emp.leaveBalance.cutiTahunan + emp.leaveBalance.cutiBesar + inhaldagenVal,
          }
        : { annual: 12, longLeave: 0, inhaldagen: 0, total: 12 };

      return {
        id: emp.id,
        employeeNumber: emp.nip,
        name: emp.nama,
        position: emp.jabatan || "-",
        category: resolvedCategory,
        departmentId: dept?.id || emp.bagian,
        department: {
          id: dept?.id || emp.bagian,
          code: dept?.code || "-",
          name: dept?.name || emp.bagian || "-",
        },
        stationId: resolvedStationId,
        stasiun: resolvedStationName,
        stationCode: matchedStation?.code || "-",
        appointmentDate: (emp as { appointmentDate?: Date | null }).appointmentDate
          ? (emp as { appointmentDate?: Date | null }).appointmentDate!.toISOString()
          : null,
        balances,
      };
    });

    const stations = allStations.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      departmentId: s.departmentId,
      departmentName: s.department?.name || "-",
    }));

    return { success: true, employees, departments, stations };
  } catch (error) {
    console.error("getEmployeePageDataAction error:", error);
    return {
      success: false,
      employees: [],
      departments: [],
      stations: [],
    };
  }
}

export async function getDepartmentsAction() {
  await requireAuth();

  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    });

    return {
      success: true,
      data: departments,
    };
  } catch (err) {
    console.error("Error fetching departments:", err);
    return {
      success: false,
      data: [],
    };
  }
}

export async function getStationsForDepartmentAction(departmentId?: string) {
  await requireAuth();

  try {
    let whereClause = {};
    if (departmentId && departmentId !== "ALL") {
      // Find department by ID or code or name
      const dept = await prisma.department.findFirst({
        where: {
          OR: [
            { id: departmentId },
            { code: departmentId },
            { name: departmentId },
          ],
        },
      });

      if (dept) {
        whereClause = { departmentId: dept.id };
      }
    }

    const stations = await prisma.station.findMany({
      where: whereClause,
      include: {
        department: true,
      },
      orderBy: { code: "asc" },
    });

    return {
      success: true,
      data: stations.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        departmentId: s.departmentId,
        departmentName: s.department?.name || "-",
      })),
    };
  } catch (error) {
    console.error("Get stations for department error:", error);
    return {
      success: false,
      data: [],
    };
  }
}

export async function createLeaderAction(
  data: LeaderInput
): Promise<ActionResult<{ employeeId: string }>> {
  const user = await requireAuth();

  const validation = leaderSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: "Validasi data karyawan gagal.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const {
    employeeNumber,
    name,
    position,
    departmentId,
    category,
    stationId,
    stasiun,
    appointmentDate,
    initialAnnual,
    initialLongLeave,
    initialInhaldagen,
  } = validation.data;

  try {
    // Check if NIP already exists in MySQL
    const existing = await prisma.employee.findUnique({
      where: { nip: employeeNumber.trim() },
    });

    if (existing) {
      return {
        success: false,
        message: `Karyawan dengan NIP ${employeeNumber} sudah terdaftar (${existing.nama}).`,
      };
    }

    // Resolve department name
    const dept = await prisma.department.findFirst({
      where: {
        OR: [
          { id: departmentId },
          { code: departmentId },
          { name: departmentId },
        ],
      },
    });
    const deptName = dept ? dept.name : departmentId;
    const resolvedDeptId = dept ? dept.id : departmentId;

    // Resolve station
    let resolvedStationId: string | null = stationId || null;
    let resolvedStationName: string | null = stasiun || null;

    if (stationId) {
      const st = await prisma.station.findUnique({ where: { id: stationId } });
      if (st) {
        resolvedStationName = st.name;
        resolvedStationId = st.id;
      }
    } else if (stasiun) {
      const st = await prisma.station.findFirst({ where: { name: stasiun } });
      if (st) {
        resolvedStationId = st.id;
        resolvedStationName = st.name;
      }
    }

    const pos = position && position.trim() ? position.trim() : "-";
    const empCategory = category || "PIMPINAN";

    // 1. Insert into MySQL employees table with initial leave_balances
    const createdEmp = await (prisma.employee.create as any)({
      data: {
        nip: employeeNumber.trim(),
        nama: name.trim(),
        jabatan: pos,
        bagian: deptName,
        category: empCategory,
        stationId: resolvedStationId,
        stasiun: resolvedStationName,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
        isActive: true,
        leaveBalance: {
          create: {
            nama: name.trim(),
            cutiTahunan: initialAnnual,
            cutiBesar: initialLongLeave,
            inhaldagen: initialInhaldagen,
            total: initialAnnual + initialLongLeave + initialInhaldagen,
            periode: new Date().getFullYear(),
          },
        },
      },
    });

    // 2. Audit Log
    await logAudit({
      userId: user.id,
      action: "CREATE_EMPLOYEE",
      entityType: "EMPLOYEE",
      entityId: createdEmp.id,
      description: `Menambahkan ${empCategory === "PIMPINAN" ? "Karyawan Pimpinan" : "Karyawan Pelaksana"}: ${createdEmp.nama} (NIP: ${createdEmp.nip}, Bagian: ${createdEmp.bagian}, Stasiun: ${createdEmp.stasiun || "-"}).`,
      newValues: {
        nip: createdEmp.nip,
        nama: createdEmp.nama,
        jabatan: createdEmp.jabatan,
        bagian: createdEmp.bagian,
        category: createdEmp.category,
        stasiun: createdEmp.stasiun,
        initialAnnual,
        initialLongLeave,
        initialInhaldagen,
      },
    });

    return {
      success: true,
      message: `Data karyawan ${createdEmp.nama} (${empCategory}) berhasil disimpan ke database MySQL!`,
      data: {
        employeeId: createdEmp.id,
      },
    };
  } catch (error) {
    console.error("Create employee error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menambahkan data karyawan ke database.",
    };
  }
}

export async function updateLeaderAction(
  id: string,
  data: {
    employeeNumber: string;
    name: string;
    position?: string;
    departmentId?: string;
    category?: "PIMPINAN" | "PELAKSANA";
    stationId?: string | null;
    stasiun?: string | null;
    appointmentDate?: string | null;
  }
): Promise<ActionResult> {
  const user = await requireAuth();

  try {
    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: "Data karyawan tidak ditemukan di database.",
      };
    }

    // Check duplicate NIP in MySQL
    if (data.employeeNumber.trim().toLowerCase() !== existing.nip.toLowerCase()) {
      const duplicate = await prisma.employee.findUnique({
        where: { nip: data.employeeNumber.trim() },
      });
      if (duplicate && duplicate.id !== id) {
        return {
          success: false,
          message: `NIP ${data.employeeNumber} sudah digunakan oleh karyawan lain (${duplicate.nama}).`,
        };
      }
    }

    // Resolve department
    let deptName = existing.bagian;
    if (data.departmentId && data.departmentId.trim()) {
      const dept = await prisma.department.findFirst({
        where: {
          OR: [
            { id: data.departmentId },
            { code: data.departmentId },
            { name: data.departmentId },
          ],
        },
      });
      deptName = dept ? dept.name : data.departmentId;
    } else if (data.departmentId === "") {
      deptName = "-";
    }

    // Resolve station
    let resolvedStationId: string | null = data.stationId !== undefined ? data.stationId : existing.stationId;
    let resolvedStationName: string | null = data.stasiun !== undefined ? data.stasiun : existing.stasiun;

    if (data.stationId) {
      const st = await prisma.station.findUnique({ where: { id: data.stationId } });
      if (st) {
        resolvedStationName = st.name;
        resolvedStationId = st.id;
      }
    }

    const pos = data.position && data.position.trim() ? data.position.trim() : "-";
    const empCategory = data.category || existing.category || "PIMPINAN";

    // 1. Update MySQL
    const updated = await (prisma.employee.update as any)({
      where: { id },
      data: {
        nip: data.employeeNumber.trim(),
        nama: data.name.trim(),
        jabatan: pos,
        bagian: deptName,
        category: empCategory,
        stationId: resolvedStationId,
        stasiun: resolvedStationName,
        ...(data.appointmentDate !== undefined
          ? {
              appointmentDate: data.appointmentDate
                ? new Date(data.appointmentDate)
                : null,
            }
          : {}),
      },
    });

    // 2. Audit Log
    await logAudit({
      userId: user.id,
      action: "UPDATE_EMPLOYEE",
      entityType: "EMPLOYEE",
      entityId: id,
      description: `Memperbarui data karyawan: ${updated.nama} (NIP: ${updated.nip}).`,
      oldValues: {
        nip: existing.nip,
        nama: existing.nama,
        jabatan: existing.jabatan,
        bagian: existing.bagian,
        category: existing.category,
        stasiun: existing.stasiun,
      },
      newValues: {
        nip: updated.nip,
        nama: updated.nama,
        jabatan: updated.jabatan,
        bagian: updated.bagian,
        category: updated.category,
        stasiun: updated.stasiun,
      },
    });

    return {
      success: true,
      message: `Data karyawan ${updated.nama} berhasil diperbarui di database!`,
      data: updated,
    };
  } catch (error) {
    console.error("Update employee error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat memperbarui data karyawan.",
    };
  }
}

export async function deleteLeaderAction(id: string): Promise<ActionResult> {
  const user = await requireAuth();

  try {
    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: "Data karyawan tidak ditemukan.",
      };
    }

    // 1. Delete from MySQL
    await prisma.employee.delete({
      where: { id },
    });

    // 2. Audit Log
    await logAudit({
      userId: user.id,
      action: "DELETE_EMPLOYEE",
      entityType: "EMPLOYEE",
      entityId: id,
      description: `Menghapus data karyawan: ${existing.nama} (NIP: ${existing.nip}).`,
    });

    return {
      success: true,
      message: `Data karyawan ${existing.nama} berhasil dihapus dari database!`,
    };
  } catch (error) {
    console.error("Delete employee error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat menghapus data karyawan dari database.",
    };
  }
}
