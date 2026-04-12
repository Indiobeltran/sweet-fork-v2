"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type MobileBottomNavItem = {
  href: string;
  icon: ReactNode;
  isActive?: boolean;
  label: string;
};

type MobileBottomNavProps = {
  items: MobileBottomNavItem[];
  moreActive?: boolean;
  moreIcon: ReactNode;
  moreLabel?: string;
  moreOpen?: boolean;
  onMoreClick: () => void;
};

const NATIVE_PICKER_SELECTOR =
  'select, input[type="date"], input[type="time"], input[type="datetime-local"], input[type="month"], input[type="week"], input[type="file"]';

function isPickerTriggerElement(target: EventTarget | null): target is HTMLElement {
  return target instanceof HTMLElement && target.matches(NATIVE_PICKER_SELECTOR);
}

export function MobileBottomNav({
  items,
  moreActive = false,
  moreIcon,
  moreLabel = "More",
  moreOpen = false,
  onMoreClick,
}: Readonly<MobileBottomNavProps>) {
  const focusClasses =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50";
  const [isSuppressedForNativePicker, setIsSuppressedForNativePicker] = useState(false);

  useEffect(() => {
    const syncSuppressedState = () => {
      const activeElement = document.activeElement;
      setIsSuppressedForNativePicker(isPickerTriggerElement(activeElement));
    };

    const handlePointerStart = (event: Event) => {
      const target = event.target;

      if (isPickerTriggerElement(target)) {
        setIsSuppressedForNativePicker(true);
        return;
      }

      if (target instanceof Element && target.closest(NATIVE_PICKER_SELECTOR)) {
        setIsSuppressedForNativePicker(true);
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;

      if (isPickerTriggerElement(target)) {
        setIsSuppressedForNativePicker(true);
        return;
      }

      if (target instanceof Element && target.closest(NATIVE_PICKER_SELECTOR)) {
        setIsSuppressedForNativePicker(true);
      }
    };

    const handleFocusOut = () => {
      window.requestAnimationFrame(syncSuppressedState);
    };

    const handleChange = () => {
      window.requestAnimationFrame(syncSuppressedState);
    };

    const handleVisibilityOrWindowFocus = () => {
      window.requestAnimationFrame(syncSuppressedState);
    };

    document.addEventListener("pointerdown", handlePointerStart, true);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    document.addEventListener("change", handleChange, true);
    document.addEventListener("visibilitychange", handleVisibilityOrWindowFocus);
    window.addEventListener("focus", handleVisibilityOrWindowFocus);

    return () => {
      document.removeEventListener("pointerdown", handlePointerStart, true);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      document.removeEventListener("change", handleChange, true);
      document.removeEventListener("visibilitychange", handleVisibilityOrWindowFocus);
      window.removeEventListener("focus", handleVisibilityOrWindowFocus);
    };
  }, []);

  return (
    <div
      aria-hidden={isSuppressedForNativePicker ? "true" : undefined}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] transition-[opacity,transform] duration-200 md:hidden",
        isSuppressedForNativePicker
          ? "pointer-events-none translate-y-[calc(100%+1rem)] opacity-0"
          : "translate-y-0 opacity-100",
      )}
      data-suppressed={isSuppressedForNativePicker ? "true" : undefined}
    >
      <nav
        aria-label="Primary admin navigation"
        className="mx-auto max-w-md rounded-[1.7rem] border border-charcoal/10 bg-ivory/94 p-2 shadow-[0_18px_48px_rgba(53,37,29,0.14),0_2px_10px_rgba(53,37,29,0.05)] backdrop-blur-xl"
      >
        <div className="grid grid-cols-5 gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.isActive ? "page" : undefined}
              className={cn(
                "inline-flex min-h-[4.35rem] flex-col items-center justify-center rounded-[1.2rem] px-2 py-2 text-center transition",
                focusClasses,
                item.isActive
                  ? "bg-charcoal text-ivory shadow-soft"
                  : "text-charcoal/62 hover:bg-white hover:text-charcoal",
              )}
            >
              <span
                aria-hidden="true"
                className="flex h-[1.05rem] w-[1.05rem] items-center justify-center"
              >
                {item.icon}
              </span>
              <span className="mt-1 text-[11px] font-semibold tracking-[0.04em]">
                {item.label}
              </span>
            </Link>
          ))}

          <button
            type="button"
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            aria-label={moreActive ? `${moreLabel}, current section` : moreLabel}
            className={cn(
              "inline-flex min-h-[4.35rem] flex-col items-center justify-center rounded-[1.2rem] px-2 py-2 text-center transition",
              focusClasses,
              moreActive || moreOpen
                ? "bg-charcoal text-ivory shadow-soft"
                : "text-charcoal/62 hover:bg-white hover:text-charcoal",
            )}
            onClick={onMoreClick}
          >
            <span
              aria-hidden="true"
              className="flex h-[1.05rem] w-[1.05rem] items-center justify-center"
            >
              {moreIcon}
            </span>
            <span className="mt-1 text-[11px] font-semibold tracking-[0.04em]">{moreLabel}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
