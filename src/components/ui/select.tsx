import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-12 w-full appearance-none rounded-2xl border border-charcoal/10 bg-white px-4 text-sm text-charcoal outline-none focus:border-gold/60 focus:ring-4 focus:ring-gold/10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
