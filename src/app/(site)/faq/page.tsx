import { InquiryCta } from "@/components/site/inquiry-cta";
import { FaqList } from "@/components/site/faq-list";
import { PublicPageHero } from "@/components/site/public-page-hero";
import { getInquiryCtaBySlug } from "@/lib/site/cta";
import { getPublicFaqItems } from "@/lib/site/marketing";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "FAQ",
    description:
      "Common questions about ordering, pricing, delivery, policies, and lead times for The Sweet Fork in Centerville, Utah.",
    path: "/faq",
  });
}

export default async function FaqPage() {
  const faqItems = await getPublicFaqItems();
  const defaultCta = getInquiryCtaBySlug();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicPageHero
        eyebrow="FAQ"
        title="Answers to the questions clients ask before they inquire."
        description="These are the details that most often help with timing, customization, pricing expectations, pickup, and delivery before a quote is requested."
        accent="If anything still feels open-ended, include it in the inquiry and Melissa will address it when she reviews your request."
        cta={defaultCta}
      />
      <FaqList items={faqItems} />
      <InquiryCta
        title="Ready to ask about your own celebration?"
        description="The inquiry form is the simplest way to share your date, dessert needs, and design direction for Melissa to review. Submitting it does not reserve your date."
      />
    </div>
  );
}
