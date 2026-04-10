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
    <div className="rounded-[1.6rem] border border-charcoal/10 bg-white/92 p-3 shadow-soft sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/42">
            Admin navigation
          </p>
          <p className="mt-1 text-sm text-charcoal/64">
            Currently viewing{" "}
            <span className="font-medium text-charcoal">{activeLink.label}</span>
          </p>
        </div>

        <div className="relative sm:hidden">
          <Select
            aria-label="Jump to admin section"
            value={activeLink.href}
            onChange={(event) => handleSelectChange(event.target.value)}
            className="pr-10 text-[15px]"
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

      <nav className="mt-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]" aria-label="Admin sections">
        <div className="flex w-max min-w-full gap-2 lg:w-full lg:flex-wrap">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition",
                isActiveLink(pathname, link.href)
                  ? "border-charcoal/22 bg-charcoal text-ivory shadow-soft"
                  : "border-charcoal/12 bg-white text-charcoal hover:border-charcoal/30 hover:bg-ivory/80",
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
