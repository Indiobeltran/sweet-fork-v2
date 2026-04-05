import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[140px] w-full rounded-3xl border border-charcoal/10 bg-white px-4 py-3 text-sm text-charcoal outline-none placeholder:text-charcoal/40 focus:border-gold/60 focus:ring-4 focus:ring-gold/10",
        className,
      )}
      {...props}
    />
  );
}
