"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY > Math.max(window.innerHeight * 1.6, 640));
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      className={cn(
        "fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-40 inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-full border border-charcoal/10 bg-ivory/94 px-3 text-sm font-semibold text-charcoal shadow-[0_18px_48px_rgba(40,31,24,0.16)] backdrop-blur-xl transition duration-200 hover:border-charcoal/22 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/70 md:bottom-6 md:right-6 md:px-4",
        isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
      onClick={() => window.scrollTo({ behavior: "smooth", left: 0, top: 0 })}
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Back to Top</span>
    </button>
  );
}
