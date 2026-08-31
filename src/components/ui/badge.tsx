import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#0084c7] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#0084c7] text-white font-bold shadow-xs",
        secondary:
          "border-sky-200 bg-sky-50 text-[#0077b6] font-bold",
        destructive:
          "bg-rose-50 text-rose-700 border-rose-200 font-bold",
        success:
          "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
        warning:
          "bg-amber-50 text-amber-800 border-amber-200 font-bold",
        outline:
          "text-slate-700 border-slate-200 bg-white font-medium",
        code:
          "font-mono font-bold text-[#0077b6] bg-sky-50 border-sky-200/90 shadow-2xs",
        annual:
          "bg-sky-50 text-sky-800 border-sky-200 font-bold",
        longLeave:
          "bg-indigo-50 text-indigo-800 border-indigo-200 font-bold",
        inhaldagen:
          "bg-amber-50 text-amber-800 border-amber-200 font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
