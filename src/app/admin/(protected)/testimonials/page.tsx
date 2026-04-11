import {
  createTestimonial,
  deleteTestimonial,
  updateTestimonial,
} from "@/app/admin/(protected)/testimonials/actions";
import { AdminNoticeBanner } from "@/components/admin/admin-notice-banner";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getTestimonialAdminData } from "@/lib/admin/site-management";

export const metadata = {
  title: "Admin Testimonials",
};

type AdminTestimonialsPageProps = {
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

export default async function AdminTestimonialsPage({
  searchParams,
}: AdminTestimonialsPageProps) {
  const [rawSearchParams, testimonials] = await Promise.all([
    searchParams,
    getTestimonialAdminData(),
  ]);
  const notice = getNoticeValue(rawSearchParams);

  return (
    <div className="space-y-6">
      <AdminNoticeBanner
        notice={notice}
        notices={{
          "testimonial-created": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Testimonial created.",
          },
          "testimonial-deleted": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Testimonial deleted.",
          },
          "testimonial-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "The testimonial change could not be saved.",
          },
          "testimonial-updated": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Testimonial updated.",
          },
        }}
      />

      <AdminSectionCard
        title="Add testimonial"
        description="Keep this list polished and selective. Featured items will naturally rise to the top of the homepage rotation."
        collapsible
      >
        <form action={createTestimonial} className="space-y-4">
          <input type="hidden" name="redirectTo" value="/admin/testimonials" />

          <div>
            <Label htmlFor="new-quote">Quote</Label>
            <Textarea
              id="new-quote"
              name="quote"
              placeholder="Share the testimonial exactly as you want it shown."
              required
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <Label htmlFor="new-name">Attribution name</Label>
              <Input id="new-name" name="attributionName" placeholder="Jordan + Elise" required />
            </div>

            <div>
              <Label htmlFor="new-role">Role or context</Label>
              <Input id="new-role" name="attributionRole" placeholder="Wedding couple" />
            </div>

            <div>
              <Label htmlFor="new-source-label">Source label</Label>
              <Input id="new-source-label" name="sourceLabel" placeholder="Wedding client" />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[220px_1fr_1fr]">
            <div>
              <Label htmlFor="new-display-order">Display order</Label>
              <Input id="new-display-order" name="displayOrder" type="number" defaultValue={0} />
            </div>

            <ToggleField defaultChecked label="Feature this testimonial" name="isFeatured" />
            <ToggleField defaultChecked label="Publish on the public site" name="isPublished" />
          </div>

          <Button type="submit">Create testimonial</Button>
        </form>
      </AdminSectionCard>

      <AdminSectionCard
        title="Testimonial library"
        description="A featured testimonial is simply a stronger homepage candidate. Publishing stays separate so nothing goes live by accident."
        collapsible
        defaultOpen={false}
      >
        <div className="space-y-5">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.id}
              className="rounded-[1.8rem] border border-charcoal/10 bg-paper p-5"
            >
              <form action={updateTestimonial} className="space-y-4">
                <input type="hidden" name="testimonialId" value={testimonial.id} />
                <input type="hidden" name="redirectTo" value="/admin/testimonials" />

                <div>
                  <Label htmlFor={`testimonial-quote-${testimonial.id}`}>Quote</Label>
                  <Textarea
                    id={`testimonial-quote-${testimonial.id}`}
                    name="quote"
                    defaultValue={testimonial.quote}
                    required
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div>
                    <Label htmlFor={`testimonial-name-${testimonial.id}`}>Attribution name</Label>
                    <Input
                      id={`testimonial-name-${testimonial.id}`}
                      name="attributionName"
                      defaultValue={testimonial.attribution_name}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`testimonial-role-${testimonial.id}`}>Role or context</Label>
                    <Input
                      id={`testimonial-role-${testimonial.id}`}
                      name="attributionRole"
                      defaultValue={testimonial.attribution_role ?? ""}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`testimonial-source-${testimonial.id}`}>Source label</Label>
                    <Input
                      id={`testimonial-source-${testimonial.id}`}
                      name="sourceLabel"
                      defaultValue={testimonial.source_label ?? ""}
                    />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[220px_1fr_1fr]">
                  <div>
                    <Label htmlFor={`testimonial-order-${testimonial.id}`}>Display order</Label>
                    <Input
                      id={`testimonial-order-${testimonial.id}`}
                      name="displayOrder"
                      type="number"
                      defaultValue={testimonial.display_order}
                    />
                  </div>

                  <ToggleField
                    defaultChecked={testimonial.is_featured}
                    label="Feature this testimonial"
                    name="isFeatured"
                  />
                  <ToggleField
                    defaultChecked={testimonial.is_published}
                    label="Publish on the public site"
                    name="isPublished"
                  />
                </div>

                <Button type="submit">Save testimonial</Button>
              </form>

              <form action={deleteTestimonial} className="mt-3">
                <input type="hidden" name="testimonialId" value={testimonial.id} />
                <input type="hidden" name="redirectTo" value="/admin/testimonials" />
                <Button type="submit" variant="secondary">
                  Delete testimonial
                </Button>
              </form>
            </article>
          ))}
        </div>
      </AdminSectionCard>
    </div>
  );
}
