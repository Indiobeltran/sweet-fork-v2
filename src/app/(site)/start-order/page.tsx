import { StartOrderWizard } from "@/components/inquiry/start-order-wizard";
import { getStartOrderPageData } from "@/lib/inquiries/catalog";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "Start Your Inquiry",
    description:
      "Tell Melissa about your celebration, dessert needs, budget, and inspiration for a custom quote from The Sweet Fork in Centerville, Utah.",
    path: "/start-order",
  });
}

export const dynamic = "force-dynamic";

export default async function StartOrderPage() {
  const pageData = await getStartOrderPageData();

  return (
    <div className="pb-6 pt-5 sm:pt-10">
      <h1 className="sr-only">Start your inquiry</h1>
      <StartOrderWizard {...pageData} />
    </div>
  );
}
