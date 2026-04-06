import { getSiteShellData } from "@/lib/site/marketing";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteShellData();

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <SiteHeader brandName={site.name} tagline={site.tagline} />
      <main>{children}</main>
      <SiteFooter site={site} />
    </div>
  );
}
