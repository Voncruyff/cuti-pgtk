"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperHariProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  isError?: boolean;
  unit?: string;
  theme?: "blue" | "purple" | "amber" | "emerald" | "default";
  className?: string;
}

export function StepperHari({
  id,
  value,
  onChange,
  min = 0,
  max,
  disabled = false,
  isError = false,
  unit = "hari",
  className,
}: StepperHariProps) {
  const isAtMin = value <= min;
  const isAtMax = max !== undefined && value >= max;

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || isAtMin) return;
    onChange(Math.max(min, value - 1));
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || isAtMax) return;
    const next = max !== undefined ? Math.min(max, value + 1) : value + 1;
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") {
      onChange(0);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) return;

    if (max !== undefined && parsed > max) {
      onChange(max);
    } else if (parsed < min) {
      onChange(min);
    } else {
      onChange(parsed);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between h-9 bg-slate-100/80 hover:bg-slate-100/95 rounded-lg p-1 transition-all select-none border border-slate-200/60",
        isError && "bg-red-50/80 border-red-300 ring-1 ring-red-400",
        disabled && "opacity-50 pointer-events-none bg-slate-100/50",
        className
      )}
    >
      {/* Tombol Kurang (-) */}
      <button
        type="button"
        tabIndex={-1}
        onClick={handleDecrement}
        disabled={disabled || isAtMin}
        aria-label="Kurangi jumlah hari"
        className="h-7 w-7 rounded-md bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer border border-slate-200/50"
      >
        <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
      </button>

      {/* Input Angka (Anti-Scroll, hanya digit angka) */}
      <div className="flex-1 flex items-center justify-center px-1">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value === 0 ? "0" : value}
          onChange={handleInputChange}
          onWheel={(e) => e.currentTarget.blur()}
          disabled={disabled}
          className="text-center font-mono font-bold text-sm text-slate-800 bg-transparent outline-none w-8 p-0"
        />
        {unit && (
          <span className="text-[11px] text-slate-400 font-medium select-none pointer-events-none ml-1">
            {unit}
          </span>
        )}
      </div>

      {/* Tombol Tambah (+) */}
      <button
        type="button"
        tabIndex={-1}
        onClick={handleIncrement}
        disabled={disabled || isAtMax}
        aria-label="Tambah jumlah hari"
        className="h-7 w-7 rounded-md bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer border border-slate-200/50"
      >
        <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
}
