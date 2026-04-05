import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-charcoal/10 bg-white px-4 text-sm text-charcoal outline-none placeholder:text-charcoal/40 focus:border-gold/60 focus:ring-4 focus:ring-gold/10",
        className,
      )}
      {...props}
    />
  );
}
