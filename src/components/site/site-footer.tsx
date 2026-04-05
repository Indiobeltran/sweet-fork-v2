import Link from "next/link";

import { footerNavigation, siteConfig } from "@/lib/content/site-content";

export function SiteFooter() {
  return (
    <footer className="border-t border-charcoal/8 bg-charcoal text-ivory">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div className="space-y-5">
          <div>
            <p className="font-serif text-3xl tracking-[-0.03em]">{siteConfig.name}</p>
            <p className="mt-2 max-w-md text-sm leading-7 text-ivory/70">{siteConfig.description}</p>
          </div>
          <div className="space-y-1 text-sm text-ivory/76">
            <p>{siteConfig.location}</p>
            <a href={`mailto:${siteConfig.email}`} className="block transition hover:text-ivory">
              {siteConfig.email}
            </a>
            <a href={`tel:${siteConfig.phone}`} className="block transition hover:text-ivory">
              {siteConfig.phone}
            </a>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ivory/55">Services</p>
          <div className="mt-5 space-y-3">
            {footerNavigation.services.map((item) => (
              <Link key={item.href} href={item.href} className="block text-sm text-ivory/76 transition hover:text-ivory">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ivory/55">Company</p>
          <div className="mt-5 space-y-3">
            {footerNavigation.company.map((item) => (
              <Link key={item.href} href={item.href} className="block text-sm text-ivory/76 transition hover:text-ivory">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
