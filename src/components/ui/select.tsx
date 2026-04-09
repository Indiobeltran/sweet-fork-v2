import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "h-12 w-full appearance-none rounded-2xl border border-charcoal/10 bg-white px-4 text-sm text-charcoal outline-none focus:border-gold/60 focus:ring-4 focus:ring-gold/10",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
