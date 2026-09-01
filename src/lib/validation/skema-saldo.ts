import { z } from "zod";

export const addBalanceSchema = z.object({
  employeeId: z.string().min(1, "Karyawan wajib dipilih"),
  leaveTypeCode: z.enum(["ANNUAL", "LONG_LEAVE", "INHALDAGEN"], {
    errorMap: () => ({ message: "Jenis cuti wajib dipilih" }),
  }),
  amount: z.coerce
    .number()
    .int("Jumlah hari harus berupa bilangan bulat")
    .min(1, "Jumlah hari minimal 1 hari")
    .max(90, "Jumlah hari maksimal 90 hari dalam satu kali input"),
  transactionDate: z.string().min(1, "Tanggal mutasi wajib diisi"),
  description: z.string().min(3, "Alasan / dasar penambahan minimal 3 karakter"),
  notes: z.string().optional(),
});

export type AddBalanceInput = z.infer<typeof addBalanceSchema>;
