import { createFaqItem, deleteFaqItem, updateFaqItem } from "@/app/admin/(protected)/faqs/actions";
import { AdminNoticeBanner } from "@/components/admin/admin-notice-banner";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getFaqAdminData } from "@/lib/admin/site-management";

export const metadata = {
  title: "Admin FAQs",
};

type AdminFaqPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getNoticeValue(rawSearchParams: Record<string, string | string[] | undefined>) {
  const noticeValue = rawSearchParams.notice;
  return Array.isArray(noticeValue) ? noticeValue[0] : noticeValue;
}

function ToggleField({
  defaultChecked,
  label,
  name,
}: Readonly<{
  defaultChecked: boolean;
  label: string;
  name: string;
}>) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-charcoal/10 bg-ivory/55 px-4 py-3 text-sm text-charcoal/74">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-charcoal/20 text-charcoal focus:ring-gold/20"
      />
      <span>{label}</span>
    </label>
  );
}

export default async function AdminFaqPage({ searchParams }: AdminFaqPageProps) {
  const [rawSearchParams, faqs] = await Promise.all([searchParams, getFaqAdminData()]);
  const notice = getNoticeValue(rawSearchParams);

  return (
    <div className="space-y-6">
      <AdminNoticeBanner
        notice={notice}
        notices={{
          "faq-created": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "FAQ item created.",
          },
          "faq-deleted": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "FAQ item deleted.",
          },
          "faq-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "The FAQ change could not be saved.",
          },
          "faq-updated": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "FAQ item updated.",
          },
        }}
      />

      <AdminSectionCard
        title="Add FAQ"
        description="Keep answers short, practical, and confidence-building. This list feeds the public FAQ page directly."
      >
        <form action={createFaqItem} className="space-y-4">
          <input type="hidden" name="redirectTo" value="/admin/faqs" />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Label htmlFor="new-question">Question</Label>
              <Input id="new-question" name="question" placeholder="How early should I reach out?" required />
            </div>

            <div>
              <Label htmlFor="new-category">Category key</Label>
              <Input id="new-category" name="categoryKey" placeholder="ordering" required />
            </div>
          </div>

          <div>
            <Label htmlFor="new-answer">Answer</Label>
            <Textarea
              id="new-answer"
              name="answer"
              placeholder="Share the short, customer-facing answer."
              required
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <div>
              <Label htmlFor="new-display-order">Display order</Label>
              <Input id="new-display-order" name="displayOrder" type="number" defaultValue={0} />
            </div>

            <ToggleField defaultChecked label="Publish this answer on the live FAQ page" name="isPublished" />
          </div>

          <Button type="submit">Create FAQ item</Button>
        </form>
      </AdminSectionCard>

      <AdminSectionCard
        title="FAQ library"
        description="The category key is mostly for internal grouping and ordering. The public page still stays simple and easy to scan."
      >
        <div className="space-y-5">
          {faqs.map((faq) => (
            <article
              key={faq.id}
              className="rounded-[1.8rem] border border-charcoal/10 bg-paper p-5"
            >
              <form action={updateFaqItem} className="space-y-4">
                <input type="hidden" name="faqId" value={faq.id} />
                <input type="hidden" name="redirectTo" value="/admin/faqs" />

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <Label htmlFor={`faq-question-${faq.id}`}>Question</Label>
                    <Input id={`faq-question-${faq.id}`} name="question" defaultValue={faq.question} required />
                  </div>

                  <div>
                    <Label htmlFor={`faq-category-${faq.id}`}>Category key</Label>
                    <Input
                      id={`faq-category-${faq.id}`}
                      name="categoryKey"
                      defaultValue={faq.category_key}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`faq-answer-${faq.id}`}>Answer</Label>
                  <Textarea id={`faq-answer-${faq.id}`} name="answer" defaultValue={faq.answer} required />
                </div>

                <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                  <div>
                    <Label htmlFor={`faq-order-${faq.id}`}>Display order</Label>
                    <Input
                      id={`faq-order-${faq.id}`}
                      name="displayOrder"
                      type="number"
                      defaultValue={faq.display_order}
                    />
                  </div>

                  <ToggleField
                    defaultChecked={faq.is_published}
                    label="Show this answer on the live FAQ page"
                    name="isPublished"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit">Save FAQ item</Button>
                </div>
              </form>

              <form action={deleteFaqItem} className="mt-3">
                <input type="hidden" name="faqId" value={faq.id} />
                <input type="hidden" name="redirectTo" value="/admin/faqs" />
                <Button type="submit" variant="secondary">
                  Delete FAQ item
                </Button>
              </form>
            </article>
          ))}
        </div>
      </AdminSectionCard>
    </div>
  );
}
