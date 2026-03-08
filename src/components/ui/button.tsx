"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-[linear-gradient(135deg,var(--soft-glow),var(--accent-gold))] px-5 py-3 text-slate-950 shadow-[0_12px_40px_rgba(100,230,255,0.25)] hover:brightness-110",
        secondary:
          "border border-white/12 bg-white/6 px-5 py-3 text-slate-100 hover:border-white/22 hover:bg-white/10",
        ghost: "px-4 py-2 text-slate-300 hover:bg-white/6 hover:text-white",
        soft: "bg-cyan-300/18 px-5 py-3 text-cyan-100 ring-1 ring-cyan-300/35 hover:bg-cyan-300/24",
      },
      size: {
        sm: "h-10 px-4",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);

Button.displayName = "Button";

