import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-12 min-w-0 w-full max-w-full rounded-2xl border border-charcoal/10 bg-white px-4 text-sm text-charcoal outline-none placeholder:text-charcoal/40 focus:border-gold/60 focus:ring-4 focus:ring-gold/10",
          className,
        )}
        {...props}
      />
    );
  },
);
