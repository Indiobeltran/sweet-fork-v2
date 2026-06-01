"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

import { signOutAdmin } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { cn, toTitleCase } from "@/lib/utils";

type AdminAccountMenuProps = {
  admin: {
    email: string;
    fullName: string;
    role: string;
  };
};

function getAdminInitials(value: string) {
  const tokens = value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return "SF";
  }

  return tokens
    .slice(0, 2)
    .map((token) => token.charAt(0))
    .join("")
    .toUpperCase();
}

function AdminAccountRoleCard({ roleLabel }: Readonly<{ roleLabel: string }>) {
  return (
    <div className="rounded-[1.2rem] border border-charcoal/8 bg-paper/72 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/42">
        Role
      </p>
      <p className="mt-1 text-sm font-medium text-charcoal">{roleLabel}</p>
    </div>
  );
}

function AdminAccountActions({ onNavigate }: Readonly<{ onNavigate: () => void }>) {
  return (
    <div className="mt-4 grid gap-2">
      <Link
        href="/"
        onClick={onNavigate}
        className="inline-flex h-11 items-center justify-center rounded-full border border-charcoal/12 bg-ivory/82 px-4 text-sm font-medium text-charcoal transition hover:border-charcoal/24 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
      >
        View site
      </Link>

      <form action={signOutAdmin}>
        <Button type="submit" variant="secondary" className="w-full justify-center">
          Sign out
        </Button>
      </form>
    </div>
  );
}

export function AdminAccountMenu({ admin }: Readonly<AdminAccountMenuProps>) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const identity = admin.fullName || admin.email;
  const roleLabel = toTitleCase(admin.role);
  const initials = getAdminInitials(identity);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={isOpen ? "Close account menu" : "Open account menu"}
        className="flex items-center gap-2 rounded-full border border-charcoal/10 bg-white/84 px-2 py-2 text-left shadow-[0_10px_26px_rgba(53,37,29,0.05)] transition hover:border-charcoal/18 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <span className="hidden min-w-0 pr-1 text-right sm:block">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal/44">
            Account
          </span>
          <span className="block max-w-[8.5rem] truncate text-sm font-medium text-charcoal">
            {admin.fullName || "Profile"}
          </span>
        </span>

        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-charcoal text-[11px] font-semibold uppercase tracking-[0.16em] text-ivory shadow-soft">
          {initials}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "hidden h-4 w-4 text-charcoal/48 transition sm:block",
            isOpen ? "rotate-180" : "",
          )}
        />
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Close account menu"
            className="fixed inset-0 z-[60] cursor-default bg-transparent"
            onClick={() => setIsOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Account menu"
            className="absolute right-0 top-[calc(100%+0.7rem)] z-[70] w-[18.5rem] max-w-[calc(100vw-1.5rem)] rounded-[1.6rem] border border-charcoal/10 bg-white/96 p-4 shadow-[0_24px_64px_rgba(53,37,29,0.14),0_8px_20px_rgba(53,37,29,0.08)] backdrop-blur-xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
              Sweet Fork Admin
            </p>
            <p className="mt-3 text-base font-medium text-charcoal">{identity}</p>
            <p className="mt-1 text-sm text-charcoal/62">{admin.email}</p>

            <div className="mt-4">
              <AdminAccountRoleCard roleLabel={roleLabel} />
            </div>

            <AdminAccountActions onNavigate={() => setIsOpen(false)} />
          </div>


        </>
      ) : null}
    </div>
  );
}
