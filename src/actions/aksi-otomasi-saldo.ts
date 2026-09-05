"use server";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit-logger";
import { formatDateIndo } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export interface AccrualDetail {
  nip: string;
  nama: string;
  tglPengangkatan: string;
  masaKerjaTahun: number;
  cutiTahunanDitambah: number;
  cutiTahunanKedaluwarsa: number;
  cutiBesarDitambah: number;
  cutiBesarKedaluwarsa: number;
  inhaldagenKedaluwarsa: number;
  status: "ACCRUED" | "EXPIRED" | "UP_TO_DATE" | "SKIPPED";
  keterangan: string;
}

export interface AccrualExecutionResult {
  success: boolean;
  message: string;
  data?: {
    totalEmployeesChecked: number;
    annualAccruedCount: number;
    longLeaveAccruedCount: number;
    expiredCount: number;
    upToDateCount: number;
    executedAt: string;
    executedBy: string;
    details: AccrualDetail[];
  };
}

/**
 * Mesin Eksekusi Otomatisasi Saldo & Kedaluwarsa Kuota
 * 
 * Aturan Bisnis:
 * 1. CUTI TAHUNAN:
 *    - Diberikan saat masa kerja mencapai minimal 1 tahun sejak tgl_pengangkatan (SK).
 *    - Diberikan berulang setiap 1 tahun tepat pada tanggal & bulan pengangkatan.
 *    - Carry Over: Sisa kuota periode sebelumnya yang melebihi batas simpan (default maks 6 hari) dihanguskan (kedaluwarsa).
 * 2. CUTI BESAR:
 *    - Diberikan saat masa kerja mencapai kelipatan 6 tahun (6, 12, 18, dst) pada tanggal & bulan pengangkatan.
 *    - Masa berlaku 3 tahun. Sisa kuota cuti besar setelah 3 tahun dihanguskan.
 * 3. INHALDAGEN:
 *    - Masa berlaku default 12 bulan sejak tanggal penugasan.
 */
export async function executeAutomatedLeaveAccrualsAction(options?: {
  forceEmployeeId?: string;
  isSystemCall?: boolean;
}): Promise<AccrualExecutionResult> {
  const currentUser = await getCurrentUser();

  // Jika bukan pemanggilan internal sistem (cron), pastikan user terautentikasi dan memiliki hak akses
  if (!options?.isSystemCall && (!currentUser || currentUser.role !== "ADMIN_UTAMA")) {
    return {
      success: false,
      message: "Hanya Admin Utama yang memiliki hak akses untuk menjalankan eksekusi otomatisasi saldo.",
    };
  }

  const executorName = currentUser?.fullName || "Sistem Otomatisasi";
  const executorId = currentUser?.id || "system-scheduler";

  try {
    // 1. Ambil Kebijakan Otomasi dari Tabel `otomasi_saldo_cuti`
    const policies = await prisma.otomasiSaldoCuti.findMany();
    const annualPolicy = policies.find((p: any) => p.jenisCuti === "CUTI_TAHUNAN") || {
      isOtomatisAktif: true,
      saldoDiberikan: 12,
      minMasaKerja: 1,
      siklusUlang: 1,
      masaBerlaku: 1,
      isCarryOver: true,
      maxCarryOver: 6,
    };

    const longLeavePolicy = policies.find((p: any) => p.jenisCuti === "CUTI_BESAR") || {
      isOtomatisAktif: true,
      saldoDiberikan: 30,
      minMasaKerja: 6,
      siklusUlang: 6,
      masaBerlaku: 3,
      isCarryOver: false,
      maxCarryOver: 0,
    };

    const inhaldagenPolicy = policies.find((p: any) => p.jenisCuti === "INHALDAGEN") || {
      isOtomatisAktif: true,
      saldoDiberikan: 0,
      minMasaKerja: 0,
      siklusUlang: 0,
      masaBerlaku: 12, // bulan
      satuanBerlaku: "BULAN",
      isCarryOver: false,
      maxCarryOver: 0,
    };

    // 2. Ambil seluruh Karyawan Aktif yang memiliki Tanggal Pengangkatan
    const whereClause: any = {
      isActive: true,
      appointmentDate: { not: null },
    };

    if (options?.forceEmployeeId) {
      whereClause.OR = [
        { id: options.forceEmployeeId },
        { nip: options.forceEmployeeId },
      ];
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        leaveBalance: true,
      },
    });

    if (employees.length === 0) {
      return {
        success: true,
        message: "Tidak ada data karyawan aktif dengan tanggal pengangkatan yang perlu diproses.",
        data: {
          totalEmployeesChecked: 0,
          annualAccruedCount: 0,
          longLeaveAccruedCount: 0,
          expiredCount: 0,
          upToDateCount: 0,
          executedAt: new Date().toISOString(),
          executedBy: executorName,
          details: [],
        },
      };
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed (0 = Jan)
    const currentDate = today.getDate();

    let annualAccruedCount = 0;
    let longLeaveAccruedCount = 0;
    let expiredCount = 0;
    let upToDateCount = 0;
    const executionDetails: AccrualDetail[] = [];

    for (const emp of employees) {
      if (!emp.appointmentDate) continue;

      const isPelaksana = emp.category?.toUpperCase() === "PELAKSANA";
      const appt = new Date(emp.appointmentDate);
      const apptYear = appt.getFullYear();
      const apptMonth = appt.getMonth();
      const apptDay = appt.getDate();

      // Apakah hari ini sudah mencapai / melewati hari ulang tahun pengangkatan tahun ini?
      const hasPassedAnniversaryThisYear =
        currentMonth > apptMonth ||
        (currentMonth === apptMonth && currentDate >= apptDay);

      // Tahun siklus acuan: jika sudah lewat hari-H tahun ini -> gunakan tahun ini, jika belum -> gunakan tahun sebelumnya
      const latestAnniversaryYear = hasPassedAnniversaryThisYear
        ? currentYear
        : currentYear - 1;

      // Masa kerja genap pada ulang tahun pengangkatan terakhir
      const completedYears = latestAnniversaryYear - apptYear;

      let annualAdded = 0;
      let annualExpired = 0;
      let longLeaveAdded = 0;
      let longLeaveExpired = 0;
      let inhaldagenExpired = 0;
      const notes: string[] = [];

      // Tanggal efektif transaksi (tepat pada tanggal & bulan pengangkatan tahun tersebut)
      const effectiveDate = new Date(latestAnniversaryYear, apptMonth, apptDay, 8, 0, 0);

      // ----------------------------------------------------
      // A. EKSEKUSI CUTI TAHUNAN
      // ----------------------------------------------------
      if (annualPolicy.isOtomatisAktif && completedYears >= annualPolicy.minMasaKerja) {
        // Cek apakah untuk tahun siklus ini karyawan sudah pernah dikreditkan otomatis
        const existingAnnualAccrual = await prisma.balanceActivity.findFirst({
          where: {
            nip: emp.nip,
            keperluan: `AUTO_ACCRUAL_ANNUAL_${latestAnniversaryYear}`,
          },
        });

        if (!existingAnnualAccrual) {
          // Hitung Sisa Saldo Lama & Aturan Carry Over / Kedaluwarsa
          const curAnnualBalance = emp.leaveBalance?.cutiTahunan ?? 0;

          if (annualPolicy.isCarryOver) {
            const maxCarry = annualPolicy.maxCarryOver || 6;
            if (curAnnualBalance > maxCarry) {
              annualExpired = curAnnualBalance - maxCarry;
            }
          } else {
            // Jika carry over tidak aktif, seluruh sisa kuota sebelumnya hangus
            annualExpired = curAnnualBalance;
          }

          annualAdded = typeof annualPolicy.saldoDiberikan === "number" ? annualPolicy.saldoDiberikan : 12;

          // Jalankan transaksi database untuk penyesuaian saldo tahunan
          await prisma.$transaction(async (tx: any) => {
            // 1. Jika ada kuota yang kedaluwarsa (hangus), catat di aktivitas_saldo
            if (annualExpired > 0) {
              const expireTxId = `exp-ann-${emp.nip}-${Date.now()}`;
              await tx.$executeRaw`
                INSERT INTO aktivitas_saldo (
                  id, nip, nama, jenis_transaksi, uraian, tgl_transaksi, tgl_cuti, cuti_tahunan, cuti_besar, inhaldagen, total_hari, keperluan, created_at, updated_at
                ) VALUES (
                  ${expireTxId}, ${emp.nip}, ${emp.nama}, 'KEDALUWARSA', 
                  ${`Kedaluwarsa Kuota Cuti Tahunan (Sisa periode sebelumnya hangus sebanyak ${annualExpired} hari)`}, 
                  ${effectiveDate}, NULL, ${annualExpired}, 0, 0, ${annualExpired}, 
                  ${`AUTO_EXPIRE_ANNUAL_${latestAnniversaryYear}`}, NOW(), NOW()
                )
              `;
            }

            // 2. Catat penambahan kuota hak cuti tahunan baru
            const accrualTxId = `acc-ann-${emp.nip}-${Date.now()}`;
            await tx.$executeRaw`
              INSERT INTO aktivitas_saldo (
                id, nip, nama, jenis_transaksi, uraian, tgl_transaksi, tgl_cuti, cuti_tahunan, cuti_besar, inhaldagen, total_hari, keperluan, created_at, updated_at
              ) VALUES (
                ${accrualTxId}, ${emp.nip}, ${emp.nama}, 'TAMBAH_SALDO', 
                ${`Hak Cuti Tahunan Otomatis (Masa Kerja ${completedYears} Thn, SK: ${formatDateIndo(emp.appointmentDate)})`}, 
                ${effectiveDate}, NULL, ${annualAdded}, 0, 0, ${annualAdded}, 
                ${`AUTO_ACCRUAL_ANNUAL_${latestAnniversaryYear}`}, NOW(), NOW()
              )
            `;

            // 3. Update saldo akhir di saldo_cuti
            const keptFromOld = curAnnualBalance - annualExpired;
            const newAnnual = keptFromOld + annualAdded;
            const currentLong = emp.leaveBalance?.cutiBesar ?? 0;
            const currentInhal = isPelaksana ? 0 : (emp.leaveBalance?.inhaldagen ?? 0);
            const newTotal = newAnnual + currentLong + currentInhal;

            await tx.leaveBalance.upsert({
              where: { nip: emp.nip },
              create: {
                nip: emp.nip,
                nama: emp.nama,
                cutiTahunan: newAnnual,
                cutiBesar: currentLong,
                inhaldagen: currentInhal,
                total: newTotal,
                periode: latestAnniversaryYear,
              },
              update: {
                cutiTahunan: newAnnual,
                total: newTotal,
                periode: latestAnniversaryYear,
              },
            });
          });

          annualAccruedCount++;
          notes.push(`+${annualAdded} Cuti Tahunan (${latestAnniversaryYear})`);
          if (annualExpired > 0) {
            expiredCount++;
            notes.push(`-${annualExpired} Cuti Tahunan Kedaluwarsa`);
          }
        }
      }

      // ----------------------------------------------------
      // B. EKSEKUSI CUTI BESAR
      // ----------------------------------------------------
      if (longLeavePolicy.isOtomatisAktif && completedYears >= longLeavePolicy.minMasaKerja) {
        // Cuti besar didapatkan setiap kelipatan 6 tahun (6, 12, 18, 24, dst)
        const isLongLeaveCycleDue = completedYears % (longLeavePolicy.siklusUlang || 6) === 0;

        if (isLongLeaveCycleDue) {
          const longLeaveCycleKey = `AUTO_ACCRUAL_LONG_LEAVE_${latestAnniversaryYear}_YR${completedYears}`;

          const existingLongAccrual = await prisma.balanceActivity.findFirst({
            where: {
              nip: emp.nip,
              keperluan: longLeaveCycleKey,
            },
          });

          if (!existingLongAccrual) {
            longLeaveAdded = typeof longLeavePolicy.saldoDiberikan === "number" ? longLeavePolicy.saldoDiberikan : 30;

            await prisma.$transaction(async (tx: any) => {
              const accrualTxId = `acc-lng-${emp.nip}-${Date.now()}`;
              await tx.$executeRaw`
                INSERT INTO aktivitas_saldo (
                  id, nip, nama, jenis_transaksi, uraian, tgl_transaksi, tgl_cuti, cuti_tahunan, cuti_besar, inhaldagen, total_hari, keperluan, created_at, updated_at
                ) VALUES (
                  ${accrualTxId}, ${emp.nip}, ${emp.nama}, 'TAMBAH_SALDO', 
                  ${`Hak Cuti Besar Otomatis (Siklus ke-${completedYears / 6}, Masa Kerja ${completedYears} Thn)`}, 
                  ${effectiveDate}, NULL, 0, ${longLeaveAdded}, 0, ${longLeaveAdded}, 
                  ${longLeaveCycleKey}, NOW(), NOW()
                )
              `;

              // Ambil saldo terkini setelah operasi tahunan jika ada
              const freshEmp = await tx.employee.findUnique({
                where: { nip: emp.nip },
                include: { leaveBalance: true },
              });

              const curAnnual = freshEmp?.leaveBalance?.cutiTahunan ?? 12;
              const curInhal = isPelaksana ? 0 : (freshEmp?.leaveBalance?.inhaldagen ?? 0);
              const newLong = (freshEmp?.leaveBalance?.cutiBesar ?? 0) + longLeaveAdded;
              const newTotal = curAnnual + newLong + curInhal;

              await tx.leaveBalance.upsert({
                where: { nip: emp.nip },
                create: {
                  nip: emp.nip,
                  nama: emp.nama,
                  cutiTahunan: curAnnual,
                  cutiBesar: newLong,
                  inhaldagen: curInhal,
                  total: newTotal,
                  periode: latestAnniversaryYear,
                },
                update: {
                  cutiBesar: newLong,
                  total: newTotal,
                },
              });
            });

            longLeaveAccruedCount++;
            notes.push(`+${longLeaveAdded} Cuti Besar (Siklus ${completedYears} Thn)`);
          }
        }

        // Cek Kedaluwarsa Cuti Besar (Masa Berlaku default 3 Tahun)
        const longLeaveValidityYears = longLeavePolicy.masaBerlaku || 3;
        const previousLongLeaveGrantYear = latestAnniversaryYear - longLeaveValidityYears;
        const expireCheckKey = `AUTO_EXPIRE_LONG_LEAVE_${previousLongLeaveGrantYear}`;

        const existingLongExpire = await prisma.balanceActivity.findFirst({
          where: {
            nip: emp.nip,
            keperluan: expireCheckKey,
          },
        });

        if (!existingLongExpire && (emp.leaveBalance?.cutiBesar ?? 0) > 0) {
          const lastGrantedActivity = await prisma.balanceActivity.findFirst({
            where: {
              nip: emp.nip,
              jenisTransaksi: "TAMBAH_SALDO",
              cutiBesar: { gt: 0 },
            },
            orderBy: { tglTransaksi: "desc" },
          });

          if (lastGrantedActivity) {
            const grantDate = new Date(lastGrantedActivity.tglTransaksi);
            const expiryLimitDate = new Date(grantDate);
            expiryLimitDate.setFullYear(expiryLimitDate.getFullYear() + longLeaveValidityYears);

            if (today >= expiryLimitDate) {
              longLeaveExpired = emp.leaveBalance?.cutiBesar ?? 0;

              if (longLeaveExpired > 0) {
                await prisma.$transaction(async (tx: any) => {
                  const expTxId = `exp-lng-${emp.nip}-${Date.now()}`;
                  await tx.$executeRaw`
                    INSERT INTO aktivitas_saldo (
                      id, nip, nama, jenis_transaksi, uraian, tgl_transaksi, tgl_cuti, cuti_tahunan, cuti_besar, inhaldagen, total_hari, keperluan, created_at, updated_at
                    ) VALUES (
                      ${expTxId}, ${emp.nip}, ${emp.nama}, 'KEDALUWARSA', 
                      ${`Kedaluwarsa Kuota Cuti Besar (Masa berlaku ${longLeaveValidityYears} tahun telah habis)`}, 
                      ${expiryLimitDate}, NULL, 0, ${longLeaveExpired}, 0, ${longLeaveExpired}, 
                      ${expireCheckKey}, NOW(), NOW()
                    )
                  `;

                  const freshBal = await tx.leaveBalance.findUnique({
                    where: { nip: emp.nip },
                  });

                  const curAnn = freshBal?.cutiTahunan ?? 12;
                  const curInh = freshBal?.inhaldagen ?? 0;
                  const newTotal = curAnn + 0 + curInh;

                  await tx.leaveBalance.update({
                    where: { nip: emp.nip },
                    data: {
                      cutiBesar: 0,
                      total: newTotal,
                    },
                  });
                });

                expiredCount++;
                notes.push(`-${longLeaveExpired} Cuti Besar Kedaluwarsa`);
              }
            }
          }
        }
      }

      // ----------------------------------------------------
      // C. EKSEKUSI KEDALUWARSA INHALDAGEN (Pimpinan, 12 Bulan)
      // ----------------------------------------------------
      if (!isPelaksana && (emp.leaveBalance?.inhaldagen ?? 0) > 0) {
        const inhalVal = Number(inhaldagenPolicy.masaBerlaku) || 1;
        const inhalUnit = (inhaldagenPolicy.satuanBerlaku || "BULAN").toUpperCase();
        const cutoffDate = new Date(today);

        if (inhalUnit === "HARI") {
          cutoffDate.setDate(cutoffDate.getDate() - inhalVal);
        } else if (inhalUnit === "TAHUN") {
          cutoffDate.setFullYear(cutoffDate.getFullYear() - inhalVal);
        } else {
          // BULAN
          cutoffDate.setMonth(cutoffDate.getMonth() - inhalVal);
        }

        const oldInhalGrants: any[] = await prisma.$queryRaw`
          SELECT id, nip, tgl_transaksi, inhaldagen, keperluan 
          FROM aktivitas_saldo 
          WHERE nip = ${emp.nip} 
            AND jenis_transaksi = 'TAMBAH_SALDO' 
            AND inhaldagen > 0 
            AND tgl_transaksi < ${cutoffDate}
            AND id NOT IN (
              SELECT SUBSTRING_INDEX(keperluan, 'REF_', -1) 
              FROM aktivitas_saldo 
              WHERE nip = ${emp.nip} AND jenis_transaksi = 'KEDALUWARSA' AND inhaldagen > 0
            )
        `;

        if (oldInhalGrants && oldInhalGrants.length > 0) {
          let totalExpiring = 0;
          for (const grant of oldInhalGrants) {
            totalExpiring += Number(grant.inhaldagen) || 0;
          }

          const currentInhalBal = emp.leaveBalance?.inhaldagen ?? 0;
          inhaldagenExpired = Math.min(totalExpiring, currentInhalBal);

          if (inhaldagenExpired > 0) {
            await prisma.$transaction(async (tx: any) => {
              const expTxId = `exp-inh-${emp.nip}-${Date.now()}`;
              const refId = oldInhalGrants[0]?.id || "grant";

              await tx.$executeRaw`
                INSERT INTO aktivitas_saldo (
                  id, nip, nama, jenis_transaksi, uraian, tgl_transaksi, tgl_cuti, cuti_tahunan, cuti_besar, inhaldagen, total_hari, keperluan, created_at, updated_at
                ) VALUES (
                  ${expTxId}, ${emp.nip}, ${emp.nama}, 'KEDALUWARSA', 
                  ${`Kedaluwarsa Kuota Inhaldagen (Masa berlaku ${inhalVal} ${inhalUnit === "BULAN" ? "bulan" : inhalUnit === "HARI" ? "hari" : "tahun"} telah habis)`}, 
                  ${cutoffDate}, NULL, 0, 0, ${inhaldagenExpired}, ${inhaldagenExpired}, 
                  ${`AUTO_EXPIRE_INHALDAGEN_REF_${refId}`}, NOW(), NOW()
                )
              `;

              const freshBal = await tx.leaveBalance.findUnique({
                where: { nip: emp.nip },
              });

              const curAnn = freshBal?.cutiTahunan ?? 12;
              const curLng = freshBal?.cutiBesar ?? 0;
              const newInhal = Math.max(0, (freshBal?.inhaldagen ?? 0) - inhaldagenExpired);
              const newTotal = curAnn + curLng + newInhal;

              await tx.leaveBalance.update({
                where: { nip: emp.nip },
                data: {
                  inhaldagen: newInhal,
                  total: newTotal,
                },
              });
            });

            expiredCount++;
            notes.push(`-${inhaldagenExpired} Inhaldagen Kedaluwarsa`);
          }
        }
      }

      // Ringkasan Status per Karyawan
      let status: "ACCRUED" | "EXPIRED" | "UP_TO_DATE" | "SKIPPED" = "UP_TO_DATE";
      if (annualAdded > 0 || longLeaveAdded > 0) {
        status = "ACCRUED";
      } else if (annualExpired > 0 || longLeaveExpired > 0 || inhaldagenExpired > 0) {
        status = "EXPIRED";
      } else if (completedYears < annualPolicy.minMasaKerja) {
        status = "SKIPPED";
        notes.push(`Masa kerja belum 1 tahun (${completedYears} thn)`);
      } else {
        upToDateCount++;
        notes.push("Saldo sudah ter-update untuk periode berjalan");
      }

      executionDetails.push({
        nip: emp.nip,
        nama: emp.nama,
        tglPengangkatan: formatDateIndo(emp.appointmentDate),
        masaKerjaTahun: completedYears,
        cutiTahunanDitambah: annualAdded,
        cutiTahunanKedaluwarsa: annualExpired,
        cutiBesarDitambah: longLeaveAdded,
        cutiBesarKedaluwarsa: longLeaveExpired,
        inhaldagenKedaluwarsa: inhaldagenExpired,
        status,
        keterangan: notes.join(", ") || "Terpenuhi",
      });
    }

    // 3. Catat Riwayat Audit Log jika ada perubahan
    if (annualAccruedCount > 0 || longLeaveAccruedCount > 0 || expiredCount > 0) {
      await logAudit({
        userId: executorId,
        action: "AUTO_ACCRUAL_LEAVE",
        entityType: "LEAVE_AUTOMATION",
        entityId: `exec-${Date.now()}`,
        description: `Eksekusi Automasi Saldo: ${annualAccruedCount} Cuti Tahunan ditambah, ${longLeaveAccruedCount} Cuti Besar ditambah, ${expiredCount} kuota kedaluwarsa diproses.`,
        newValues: {
          totalChecked: employees.length,
          annualAccruedCount,
          longLeaveAccruedCount,
          expiredCount,
          upToDateCount,
        },
      });
    }

    revalidatePath("/(dashboard)/pengaturan", "page");
    revalidatePath("/(dashboard)/tambah-saldo-cuti", "page");
    revalidatePath("/(dashboard)/master-karyawan", "page");
    revalidatePath("/(dashboard)/ambil-cuti", "page");

    return {
      success: true,
      message: `Eksekusi selesai! ${annualAccruedCount} Cuti Tahunan & ${longLeaveAccruedCount} Cuti Besar berhasil dikreditkan, ${expiredCount} penyesuaian kedaluwarsa diproses.`,
      data: {
        totalEmployeesChecked: employees.length,
        annualAccruedCount,
        longLeaveAccruedCount,
        expiredCount,
        upToDateCount,
        executedAt: new Date().toISOString(),
        executedBy: executorName,
        details: executionDetails,
      },
    };
  } catch (error) {
    console.error("Error executing automated leave accruals:", error);
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat mengeksekusi otomatisasi saldo.",
    };
  }
}

/**
 * Mendapatkan ringkasan status otomatisasi saldo saat ini
 */
export async function getAutomatedLeaveAccrualSummaryAction() {
  try {
    const totalEmployees = await prisma.employee.count({
      where: { isActive: true },
    });

    const employeesWithAppt = await prisma.employee.count({
      where: {
        isActive: true,
        appointmentDate: { not: null },
      },
    });

    const currentYear = new Date().getFullYear();

    // Hitung berapa yang sudah dapat kuota tahun ini
    const countAccruedThisYear = await prisma.balanceActivity.groupBy({
      by: ["nip"],
      where: {
        keperluan: `AUTO_ACCRUAL_ANNUAL_${currentYear}`,
      },
    });

    // Aktivitas eksekusi terakhir
    const lastActivity = await prisma.balanceActivity.findFirst({
      where: {
        OR: [
          { jenisTransaksi: "KEDALUWARSA" },
          { keperluan: { startsWith: "AUTO_" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: {
        totalEmployees,
        employeesWithAppt,
        accruedThisYearCount: countAccruedThisYear.length,
        lastExecutionDate: lastActivity?.createdAt ? lastActivity.createdAt.toISOString() : null,
      },
    };
  } catch (error) {
    console.error("Error getAutomatedLeaveAccrualSummaryAction:", error);
    return {
      success: false,
      data: {
        totalEmployees: 0,
        employeesWithAppt: 0,
        accruedThisYearCount: 0,
        lastExecutionDate: null,
      },
    };
  }
}
