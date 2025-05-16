import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        active: "border-transparent bg-[#1DB954] text-white hover:bg-[#1DB954]/80",
        solved: "border-transparent bg-[#3E3E3E] text-white hover:bg-[#3E3E3E]/80",
        hot: "border-transparent bg-[#3E3E3E] text-white hover:bg-[#3E3E3E]/80",
        trending: "border-transparent bg-[#3E3E3E] text-white hover:bg-[#3E3E3E]/80",
        status: "border-transparent bg-[#3E3E3E] text-white hover:bg-[#3E3E3E]/80",
        genre: "border-transparent bg-[#3E3E3E] text-white hover:bg-[#3E3E3E]/80",
        verified: "border-transparent bg-[#3E3E3E] text-white hover:bg-[#3E3E3E]/80",
        rising: "border-transparent bg-[#3E3E3E] text-white hover:bg-[#3E3E3E]/80",
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
