import Image from "next/image";
import Link from "next/link";

import type { SiteShellData } from "@/lib/site/marketing";

type SiteFooterProps = {
  companyLinks: Array<{
    href: string;
    label: string;
  }>;
  serviceLinks: Array<{
    href: string;
    label: string;
  }>;
  site: SiteShellData;
};

export function SiteFooter({
  companyLinks,
  serviceLinks,
  site,
}: Readonly<SiteFooterProps>) {
  return (
    <footer className="border-t border-charcoal/8 bg-charcoal text-ivory">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div className="space-y-5">
          <div>
            <Image
              src="/brand/logo-light.png"
              alt={site.name}
              width={340}
              height={193}
              className="h-auto w-[180px]"
            />
            <p className="mt-2 max-w-md text-sm leading-7 text-ivory/70">{site.description}</p>
          </div>
          <div className="space-y-1 text-sm text-ivory/76">
            <p>{site.location}</p>
            <a
              href={`mailto:${site.email}`}
              className="block rounded-full transition hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
            >
              {site.email}
            </a>
            <a
              href={`tel:${site.phone}`}
              className="block rounded-full transition hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
            >
              {site.phone}
            </a>
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-full transition hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
            >
              @{site.instagramHandle}
            </a>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ivory/55">Services</p>
          <div className="mt-5 space-y-3">
            {serviceLinks.length > 0 ? (
              serviceLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-full text-sm text-ivory/76 transition hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
                >
                  {item.label}
                </Link>
              ))
            ) : (
              <p className="text-sm leading-7 text-ivory/58">
                Availability is being updated. Check the booking notice for the latest status.
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ivory/55">Company</p>
          <div className="mt-5 space-y-3">
            {companyLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-full text-sm text-ivory/76 transition hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
