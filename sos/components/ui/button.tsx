import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-base font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flame-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-hero text-white hover:scale-105 active:scale-95",
        secondary:
          "bg-bg-elevated border border-border-default text-text-primary hover:bg-bg-active hover:scale-105 active:scale-95",
        outline:
          "border-2 border-flame-primary text-flame-primary bg-transparent hover:bg-flame-primary/10 hover:scale-105 active:scale-95",
        ghost:
          "text-text-primary hover:glass rounded-2xl",
        danger:
          "bg-gradient-to-br from-tinder-red to-flame-dark text-white hover:scale-105 active:scale-95",
        success:
          "bg-success text-white hover:scale-105 active:scale-95",
        link:
          "text-flame-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-sm",
        lg: "h-14 px-8 py-4 text-lg font-black",
        xl: "h-16 px-10 py-5 text-xl font-black",
        icon: "h-12 w-12",
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
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
