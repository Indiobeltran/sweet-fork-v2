"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
];

function isActiveLink(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {adminLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition",
            isActiveLink(pathname, link.href)
              ? "border-charcoal/22 bg-charcoal text-ivory"
              : "border-charcoal/12 bg-white text-charcoal hover:border-charcoal/30",
          )}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
