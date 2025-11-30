import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold transition-all",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-hero text-white shadow-sm",
        secondary:
          "bg-bg-elevated border border-border-default text-text-primary shadow-sm",
        warm:
          "bg-amber-100 text-amber-800 border border-amber-200",
        pink:
          "bg-pink-100 text-pink-800 border border-pink-200",
        success:
          "bg-emerald-500 text-white shadow-sm",
        warning:
          "bg-amber-500 text-white shadow-sm",
        danger:
          "bg-danger text-white shadow-sm",
        outline:
          "border-2 border-flame-primary text-flame-primary bg-transparent",
        soft:
          "bg-flame-primary/10 text-flame-primary border border-flame-primary/20",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
