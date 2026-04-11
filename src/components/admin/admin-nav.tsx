"use client";

import { startTransition } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/products", label: "Products" },
];

function isActiveLink(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const activeLink =
    adminLinks.find((link) => isActiveLink(pathname, link.href)) ?? adminLinks[0];

  const handleSelectChange = (nextHref: string) => {
    if (!nextHref || nextHref === activeLink.href) {
      return;
    }

    startTransition(() => {
      router.push(nextHref);
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-[1.55rem] border border-charcoal/8 bg-white/70 p-3 shadow-[0_10px_28px_rgba(53,37,29,0.04)] md:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 sm:max-w-[10rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/42">
              Section
            </p>
            <p className="mt-1 truncate text-sm font-medium text-charcoal">{activeLink.label}</p>
          </div>

          <div className="relative min-w-0 flex-1">
            <label htmlFor="admin-section-nav" className="sr-only">
              Jump to admin section
            </label>
            <Select
              id="admin-section-nav"
              aria-label="Jump to admin section"
              value={activeLink.href}
              onChange={(event) => handleSelectChange(event.target.value)}
              className="h-12 rounded-full border-charcoal/10 bg-white/82 pr-11 text-sm font-medium shadow-[0_10px_22px_rgba(53,37,29,0.04)]"
            >
              {adminLinks.map((link) => (
                <option key={link.href} value={link.href}>
                  {link.label}
                </option>
              ))}
            </Select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/42" />
          </div>
        </div>
      </div>

      <nav
        className="hidden overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] md:block"
        aria-label="Admin sections"
      >
        <div className="inline-flex min-w-full items-center gap-1 rounded-full border border-charcoal/8 bg-white/72 p-1 shadow-[0_12px_30px_rgba(53,37,29,0.04)]">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition",
                isActiveLink(pathname, link.href)
                  ? "bg-charcoal text-ivory shadow-soft"
                  : "text-charcoal/62 hover:bg-white hover:text-charcoal",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
