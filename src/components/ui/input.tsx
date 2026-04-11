import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type, ...props }, ref) {
    const isDateLike =
      type === "date" || type === "datetime-local" || type === "month" || type === "time";

    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-12 min-w-0 w-full max-w-full rounded-2xl border border-charcoal/10 bg-white px-4 text-sm text-charcoal outline-none placeholder:text-charcoal/40 focus:border-gold/60 focus:ring-4 focus:ring-gold/10",
          isDateLike &&
            "appearance-none pr-11 text-left [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-date-and-time-value]:min-h-[1.2rem] [&::-webkit-date-and-time-value]:text-left [&::-webkit-datetime-edit]:p-0",
          className,
        )}
        {...props}
      />
    );
  },
);
