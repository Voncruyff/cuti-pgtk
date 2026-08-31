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
    cardBg: "bg-gradient-to-br from-white to-sky-50/25 border-slate-200/85",
    iconBg: "bg-sky-50 text-[#0084c7] border-sky-100",
    valueText: "text-slate-900",
  },
  indigo: {
    cardBg: "bg-gradient-to-br from-white to-indigo-50/25 border-slate-200/85",
    iconBg: "bg-indigo-50 text-indigo-700 border-indigo-100",
    valueText: "text-slate-900",
  },
  emerald: {
    cardBg: "bg-gradient-to-br from-white to-emerald-50/25 border-slate-200/85",
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
    valueText: "text-slate-900",
  },
  purple: {
    cardBg: "bg-gradient-to-br from-white to-purple-50/25 border-slate-200/85",
    iconBg: "bg-purple-50 text-purple-600 border-purple-100",
    valueText: "text-slate-900",
  },
  amber: {
    cardBg: "bg-gradient-to-br from-white to-amber-50/25 border-slate-200/85",
    iconBg: "bg-amber-50 text-amber-700 border-amber-100",
    valueText: "text-slate-900",
  },
  slate: {
    cardBg: "bg-gradient-to-br from-white to-slate-50/50 border-slate-200/85",
    iconBg: "bg-slate-100 text-slate-600 border-slate-200",
    valueText: "text-slate-900",
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
        "rounded-2xl shadow-2xs min-h-[90px] h-full flex flex-col justify-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm",
        style.cardBg,
        className
      )}
    >
      <CardContent className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-500 truncate">{title}</p>
          <p className={cn("text-xl sm:text-2xl font-black mt-0.5 tabular-nums tracking-tight", style.valueText)}>
            {value}
          </p>
          {badgeText && (
            <span className="inline-block text-[10px] font-semibold text-[#0077b6] bg-sky-50 px-2 py-0.2 rounded-full border border-sky-100 mt-1 truncate">
              {badgeText}
            </span>
          )}
          {subtitle && !badgeText && (
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{subtitle}</p>
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
