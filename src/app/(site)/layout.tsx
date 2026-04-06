import { PublicBookingNoticeBanner } from "@/components/site/public-booking-notice";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getPublicSiteChromeData } from "@/lib/site/marketing";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const chrome = await getPublicSiteChromeData();

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <a
        href="#site-main"
        className="sr-only absolute left-4 top-4 z-[60] rounded-full bg-charcoal px-4 py-2 text-sm font-medium text-ivory focus-visible:not-sr-only focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
      >
        Skip to content
      </a>
      <SiteHeader
        brandName={chrome.site.name}
        navigation={chrome.mainNavigation}
        tagline={chrome.site.tagline}
      />
      {chrome.bookingNotice ? <PublicBookingNoticeBanner notice={chrome.bookingNotice} /> : null}
      <main id="site-main">{children}</main>
      <SiteFooter
        companyLinks={chrome.footerCompanyLinks}
        serviceLinks={chrome.footerServiceLinks}
        site={chrome.site}
      />
    </div>
  );
}
