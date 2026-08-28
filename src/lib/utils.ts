import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateIndo(
  date: Date | string | null | undefined,
  pattern = "dd-MM-yyyy"
): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isNaN(d.getTime())) return "-";
  return format(d, pattern, { locale: id });
}

export function formatDateLongIndo(
  date: Date | string | null | undefined
): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isNaN(d.getTime())) return "-";
  return format(d, "dd MMMM yyyy", { locale: id });
}

export function formatSignedDays(amount: number | string | { toString: () => string }): string {
  const num = typeof amount === "number" ? amount : Number(amount.toString());
  if (isNaN(num)) return "0";
  if (num > 0) return `+${num}`;
  return `${num}`;
}

export function formatNumber(value: number | string | { toString: () => string }): string {
  const num = typeof value === "number" ? value : Number(value.toString());
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(num);
}
