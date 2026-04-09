import Image from "next/image";
import Link from "next/link";

import type { SiteShellData } from "@/lib/site/marketing";

type SiteFooterProps = {
  legalLinks: Array<{
    href: string;
    label: string;
  }>;
  site: SiteShellData;
};

export function SiteFooter({ legalLinks, site }: Readonly<SiteFooterProps>) {
  return (
    <footer className="border-t border-charcoal/8 bg-charcoal text-ivory">
      <div className="section-shell grid gap-10 py-14 md:grid-cols-[1.1fr_0.9fr] md:items-end">
        <div className="space-y-5">
          <Image
            src="/brand/logo-light.png"
            alt={site.name}
            width={340}
            height={193}
            className="h-auto w-[188px]"
          />
          <p className="max-w-xl text-sm leading-8 text-ivory/72">{site.description}</p>
          <div className="grid gap-2 text-sm text-ivory/76">
            <p>{site.location}</p>
            <a
              href={`tel:${site.phone}`}
              className="w-fit rounded-full transition hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
            >
              {site.phone}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="w-fit rounded-full transition hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
            >
              {site.email}
            </a>
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="w-fit rounded-full transition hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
            >
              @{site.instagramHandle}
            </a>
          </div>
        </div>

        <div className="space-y-5 md:justify-self-end md:text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ivory/52">Legal</p>
          <div className="flex flex-wrap gap-3 md:justify-end">
            {legalLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-ivory/74 transition hover:border-white/24 hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p className="text-sm leading-7 text-ivory/56">
            Custom cakes and desserts for pickup in Centerville and local delivery across Northern Utah.
          </p>
        </div>
      </div>
    </footer>
  );
}
