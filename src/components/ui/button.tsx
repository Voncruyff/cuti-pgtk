import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093dc] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#0084c7] via-[#0093dc] to-[#0284c7] text-white shadow-xs shadow-sky-500/25 hover:from-[#0077b6] hover:to-[#0369a1] hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0",
        destructive:
          "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-xs shadow-red-500/25 hover:from-rose-700 hover:to-red-700 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0",
        outline:
          "border border-slate-200/90 bg-white text-slate-700 shadow-2xs hover:bg-sky-50/70 hover:text-[#0077b6] hover:border-sky-300 hover:shadow-xs active:scale-[0.98]",
        secondary:
          "bg-sky-50 text-sky-800 hover:bg-sky-100/90 border border-sky-200/80 font-semibold active:scale-[0.98]",
        ghost: "text-slate-600 hover:bg-sky-50/70 hover:text-[#0077b6] active:scale-[0.98]",
        link: "text-[#0093dc] underline-offset-4 hover:underline hover:text-sky-800",
      },
      size: {
        default: "h-9 px-4.5 py-2",
        sm: "h-7.5 px-3 text-[11px]",
        lg: "h-10 px-6 text-sm font-bold",
        icon: "h-8.5 w-8.5 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
