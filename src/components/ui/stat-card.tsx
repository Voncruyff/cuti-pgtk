import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badgeText?: string;
  icon: LucideIcon;
  variant?: "sky" | "indigo" | "emerald" | "purple" | "slate" | "amber";
  className?: string;
}

const variantStyles = {
  sky: {
    cardBg: "bg-white border-[#E8F5FC] shadow-[0_4px_20px_rgb(0,0,0,0.02)]",
    iconBg: "bg-[#E8F5FC] text-[#0789D1] border-[#0789D1]/20",
    valueText: "text-[#263238]",
  },
  indigo: {
    cardBg: "bg-white border-[#E8F5FC] shadow-[0_4px_20px_rgb(0,0,0,0.02)]",
    iconBg: "bg-[#E8F5FC] text-[#005B96] border-[#005B96]/20",
    valueText: "text-[#263238]",
  },
  emerald: {
    cardBg: "bg-white border-[#E8F5FC] shadow-[0_4px_20px_rgb(0,0,0,0.02)]",
    iconBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    valueText: "text-[#263238]",
  },
  purple: {
    cardBg: "bg-white border-[#E8F5FC] shadow-[0_4px_20px_rgb(0,0,0,0.02)]",
    iconBg: "bg-[#E8F5FC] text-[#005B96] border-[#005B96]/20",
    valueText: "text-[#263238]",
  },
  amber: {
    cardBg: "bg-white border-[#E8F5FC] shadow-[0_4px_20px_rgb(0,0,0,0.02)]",
    iconBg: "bg-amber-50 text-amber-800 border-amber-200",
    valueText: "text-[#263238]",
  },
  slate: {
    cardBg: "bg-white border-[#E8F5FC] shadow-[0_4px_20px_rgb(0,0,0,0.02)]",
    iconBg: "bg-[#F3F6F8] text-[#263238] border-[#E8F5FC]",
    valueText: "text-[#263238]",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  badgeText,
  icon: Icon,
  variant = "sky",
  className,
}: StatCardProps) {
  const style = variantStyles[variant] || variantStyles.sky;

  return (
    <Card
      className={cn(
        "rounded-2xl shadow-2xs min-h-[90px] h-full flex flex-col justify-center transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgb(0,0,0,0.03)]",
        style.cardBg,
        className
      )}
    >
      <CardContent className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-[#6B7280] truncate">{title}</p>
          <p className={cn("text-xl sm:text-2xl font-black mt-0.5 tabular-nums tracking-tight", style.valueText)}>
            {value}
          </p>
          {badgeText && (
            <span className="inline-block text-[10px] font-semibold text-[#005B96] bg-[#E8F5FC] px-2 py-0.5 rounded-full border border-[#0789D1]/20 mt-1 truncate">
              {badgeText}
            </span>
          )}
          {subtitle && !badgeText && (
            <p className="text-[10px] text-[#6B7280] mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-2xs",
            style.iconBg
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
