import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[140px] w-full rounded-3xl border border-charcoal/10 bg-white px-4 py-3 text-sm text-charcoal outline-none placeholder:text-charcoal/40 focus:border-gold/60 focus:ring-4 focus:ring-gold/10",
        className,
      )}
      {...props}
    />
  );
});
