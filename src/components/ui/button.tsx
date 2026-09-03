import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl text-xs font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0789D1] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#0789D1] text-white hover:bg-[#005B96] active:bg-[#005B96]/90 shadow-xs active:scale-[0.98]",
        destructive:
          "bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 shadow-xs active:scale-[0.98]",
        outline:
          "border border-[#E8F5FC] bg-white text-[#263238] shadow-2xs hover:bg-[#E8F5FC] hover:text-[#005B96] hover:border-[#0789D1]/30 active:scale-[0.98]",
        secondary:
          "bg-[#E8F5FC] text-[#005B96] hover:bg-[#0789D1] hover:text-white border border-[#E8F5FC] active:scale-[0.98]",
        ghost: "text-[#263238] hover:bg-[#E8F5FC] hover:text-[#005B96] active:scale-[0.98]",
        link: "text-[#0789D1] underline-offset-4 hover:underline hover:text-[#005B96]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-5 text-sm font-semibold",
        icon: "h-9 w-9 p-0 shrink-0",
        "icon-sm": "h-7.5 w-7.5 p-0 shrink-0",
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
