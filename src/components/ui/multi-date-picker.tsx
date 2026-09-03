"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  RotateCcw,
  CheckCircle2,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MultiDatePickerProps {
  selectedDates: string[]; // array of 'YYYY-MM-DD'
  onChange: (dates: string[]) => void;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

// Format YYYY-MM-DD string
function toDateKey(year: number, month: number, day: number): string {
  const y = year;
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Format readable date string in Indonesian (e.g. "Sen, 31 Ags 2026")
function formatChipDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);

  const dayName = DAY_NAMES[date.getDay()];
  const monthShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Ags",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ][month];

  return `${dayName}, ${day} ${monthShort} ${year}`;
}

export function MultiDatePicker({
  selectedDates,
  onChange,
  disabled = false,
}: MultiDatePickerProps) {
  const [currentYear, setCurrentYear] = useState<number>(() => {
    if (selectedDates.length > 0) {
      const parts = selectedDates[0].split("-");
      if (parts.length === 3) return parseInt(parts[0], 10);
    }
    return new Date().getFullYear();
  });

  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    if (selectedDates.length > 0) {
      const parts = selectedDates[0].split("-");
      if (parts.length === 3) return parseInt(parts[1], 10) - 1;
    }
    return new Date().getMonth();
  });

  const [slideDirection, setSlideDirection] = useState<number>(0);

  const today = new Date();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());


  // Navigate months
  const handlePrevMonth = () => {
    if (disabled) return;
    setSlideDirection(-1);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (disabled) return;
    setSlideDirection(1);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Toggle date selection
  const handleToggleDate = (day: number) => {
    if (disabled) return;
    const dateKey = toDateKey(currentYear, currentMonth, day);
    let updated: string[];

    if (selectedDates.includes(dateKey)) {
      updated = selectedDates.filter((d) => d !== dateKey);
    } else {
      updated = [...selectedDates, dateKey].sort();
    }
    onChange(updated);
  };

  // Remove specific date
  const handleRemoveDate = (dateKey: string) => {
    if (disabled) return;
    const updated = selectedDates.filter((d) => d !== dateKey);
    onChange(updated);
  };

  // Clear all dates
  const handleClearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  // Add today quickly
  const handleSelectToday = () => {
    if (disabled) return;
    if (!selectedDates.includes(todayKey)) {
      onChange([...selectedDates, todayKey].sort());
    }
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Generate calendar days
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday

  // Previous month trailing days
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays = [];

  // Padding from prev month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      dateKey: "",
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const key = toDateKey(currentYear, currentMonth, d);
    calendarDays.push({
      day: d,
      isCurrentMonth: true,
      dateKey: key,
      isSelected: selectedDates.includes(key),
      isToday: key === todayKey,
    });
  }

  // Padding to complete 7-columns grid (rows)
  const remainingCells = (7 - (calendarDays.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      dateKey: "",
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              disabled={disabled}
              className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              disabled={disabled}
              className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              {Array.from({ length: 7 }, (_, i) => 2024 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            disabled={disabled}
            className="h-7 w-7 rounded-md border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            disabled={disabled}
            className="h-7 w-7 rounded-md border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Weekday Header */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500 border-b border-slate-100 pb-1.5">
        {DAY_NAMES.map((day, idx) => (
          <div
            key={day}
            className={idx === 0 ? "text-red-500 font-bold" : idx === 6 ? "text-blue-500" : ""}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid with subtle direction-aware slide */}
      <div className="overflow-hidden">
        <motion.div
          key={`${currentYear}-${currentMonth}`}
          initial={{ opacity: 0, x: slideDirection * 6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-7 gap-1"
        >
          {calendarDays.map((item, idx) => {
            if (!item.isCurrentMonth) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="h-8.5 flex items-center justify-center text-xs text-slate-300 select-none"
                >
                  {item.day}
                </div>
              );
            }

            const isSunday = idx % 7 === 0;

            return (
              <button
                key={item.dateKey}
                type="button"
                onClick={() => handleToggleDate(item.day)}
                disabled={disabled}
                className={`
                  h-8.5 text-xs font-semibold rounded-lg transition-[color,background-color,border-color,transform,box-shadow] duration-150 active:scale-95 flex items-center justify-center relative select-none cursor-pointer
                  ${
                    item.isSelected
                      ? "bg-[#0789D1] text-white font-bold shadow-xs hover:bg-[#005B96] ring-2 ring-[#0789D1]/30"
                      : item.isToday
                      ? "border border-[#0789D1] text-[#005B96] font-bold bg-[#E8F5FC]/70 hover:bg-[#E8F5FC]"
                      : isSunday
                      ? "text-rose-600 hover:bg-rose-50 font-bold"
                      : "text-[#263238] hover:bg-[#F3F6F8]"
                  }
                `}
              >
                <span>{item.day}</span>
                {item.isSelected && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-white text-[#0789D1] rounded-full flex items-center justify-center shadow-2xs">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* Selected Dates Display & Quick Actions */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#0084c7]" />
            <span>Tanggal Terpilih:</span>
            <span className="font-mono font-bold text-[#0077b6] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 text-xs">
              {selectedDates.length} hari
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!selectedDates.includes(todayKey) && (
              <button
                type="button"
                onClick={handleSelectToday}
                disabled={disabled}
                className="text-[11px] font-semibold text-[#0077b6] hover:text-[#0084c7] hover:underline cursor-pointer"
              >
                + Hari Ini
              </button>
            )}
            {selectedDates.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={disabled}
                className="text-[11px] font-medium text-slate-400 hover:text-red-600 flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Selected Date Badges List */}
        {selectedDates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E8F5FC] bg-[#F3F6F8] p-2.5 text-center text-xs text-[#6B7280]">
            Belum ada tanggal yang dipilih. Klik tanggal di atas untuk menentukan hari cuti.
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-xl bg-[#F3F6F8] border border-[#E8F5FC]">
            <AnimatePresence mode="popLayout">
              {selectedDates.map((dateKey) => (
                <motion.div
                  key={dateKey}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.14 }}
                >
                  <Badge
                    variant="outline"
                    className="gap-1 bg-white pl-2 pr-1.5 py-1 text-[11px] font-medium text-[#263238] border-[#E8F5FC] shadow-2xs hover:border-[#0789D1]/30 group"
                  >
                    <span>{formatChipDate(dateKey)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDate(dateKey)}
                      disabled={disabled}
                      className="rounded-full p-0.5 text-[#6B7280] hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
