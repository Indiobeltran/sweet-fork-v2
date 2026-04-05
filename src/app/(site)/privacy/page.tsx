import { PublicPageHero } from "@/components/site/public-page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy",
  description: "Privacy overview for inquiry submissions and internal business records.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div>
      <PublicPageHero
        eyebrow="Privacy"
        title="Privacy and data handling overview."
        description="This page is ready for final policy language covering inquiry data, uploaded inspiration images, admin access, and retained order history."
      />
      <section className="section-shell space-y-8 py-16 md:py-20">
        {[
          "Inquiry details are collected to evaluate availability, prepare pricing guidance, and coordinate future orders.",
          "Uploaded inspiration images and links are stored to support quoting, design review, and fulfillment coordination.",
          "Internal admin access is restricted to bakery staff with owner or manager roles.",
        ].map((item) => (
          <p key={item} className="max-w-3xl text-base leading-8 text-charcoal/72">
            {item}
          </p>
        ))}
      </section>
    </div>
  );
}
