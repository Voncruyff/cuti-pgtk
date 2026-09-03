import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[#E8F5FC]/60 shimmer-effect",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
