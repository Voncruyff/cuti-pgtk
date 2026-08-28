import { z } from "zod";

export const leaveRequestSchema = z
  .object({
    employeeId: z.string().min(1, "Karyawan wajib dipilih"),
    requestDate: z.string().min(1, "Tanggal permohonan wajib diisi"),
    startDate: z.string().min(1, "Tanggal mulai cuti wajib diisi"),
    endDate: z.string().min(1, "Tanggal selesai cuti wajib diisi"),
    annualDays: z.coerce.number().min(0, "Jumlah hari tidak valid").default(0),
    longLeaveDays: z.coerce.number().min(0, "Jumlah hari tidak valid").default(0),
    inhaldagenDays: z.coerce.number().min(0, "Jumlah hari tidak valid").default(0),
    purpose: z.string().min(3, "Keperluan / alasan cuti minimal 3 karakter"),
    notes: z.string().optional(),
  })
  .refine(
    (data) => data.annualDays > 0 || data.longLeaveDays > 0 || data.inhaldagenDays > 0,
    {
      message: "Minimal salah satu jenis cuti harus diisi lebih dari 0 hari",
      path: ["annualDays"],
    }
  );

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
