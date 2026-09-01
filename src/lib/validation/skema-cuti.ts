import { z } from "zod";

export const leaveRequestSchema = z
  .object({
    employeeId: z.string().min(1, "Karyawan wajib dipilih"),
    requestDate: z.string().min(1, "Tanggal permohonan wajib diisi"),
    selectedDates: z.array(z.string()).min(1, "Minimal pilih 1 tanggal cuti"),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
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
  )
  .refine(
    (data) => {
      const totalDays = Number(data.annualDays || 0) + Number(data.longLeaveDays || 0) + Number(data.inhaldagenDays || 0);
      return totalDays === data.selectedDates.length;
    },
    {
      message: "Total alokasi jenis cuti harus sama persis dengan jumlah tanggal cuti yang dipilih",
      path: ["annualDays"],
    }
  );

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;

