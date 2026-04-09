import Link from "next/link";

import { updateContentSection } from "@/app/admin/(protected)/content/actions";
import { AdminNoticeBanner } from "@/components/admin/admin-notice-banner";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getContentAdminData } from "@/lib/admin/site-management";
import { toTitleCase } from "@/lib/utils";

export const metadata = {
  title: "Admin Content",
};

type AdminContentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getNoticeValue(rawSearchParams: Record<string, string | string[] | undefined>) {
  const noticeValue = rawSearchParams.notice;
  return Array.isArray(noticeValue) ? noticeValue[0] : noticeValue;
}

function getFieldLabel(value: string) {
  return toTitleCase(value.replace(/([a-z0-9])([A-Z])/g, "$1 $2"));
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

export default async function AdminContentPage({ searchParams }: AdminContentPageProps) {
  const [rawSearchParams, sections] = await Promise.all([searchParams, getContentAdminData()]);
  const notice = getNoticeValue(rawSearchParams);

  return (
    <div className="space-y-6">
      <AdminNoticeBanner
        notice={notice}
        notices={{
          "content-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "The content change could not be saved. Please review the fields and try again.",
          },
          "content-updated": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Website content updated.",
          },
        }}
      />

      <div className="rounded-[1.8rem] border border-charcoal/10 bg-white/88 p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
              Settings moved
            </p>
            <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-charcoal">
              Business and launch settings now live in one place.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-charcoal/64">
              Core site details, inquiry flags, booking notices, and launch notes now live in
              Settings so this page can stay focused on structured content only.
            </p>
          </div>

          <Link
            href="/admin/settings"
            className="inline-flex h-12 items-center justify-center rounded-full border border-charcoal/15 bg-ivory/80 px-5 text-sm font-medium tracking-[0.02em] text-charcoal transition hover:border-charcoal/40 hover:bg-white"
          >
            Open settings
          </Link>
        </div>
      </div>

      <AdminSectionCard
        title="Structured sections"
        description="These forms only cover the sections already modeled for the public site. That keeps editing flexible enough for day-to-day changes without turning the app into an unrestricted CMS."
      >
        <div className="space-y-5">
          {sections.map((section) => (
            <article
              key={section.definition.key}
              className="rounded-[1.8rem] border border-charcoal/10 bg-paper p-5"
            >
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  {section.definition.title}
                </p>
                <p className="text-sm leading-7 text-charcoal/62">{section.definition.description}</p>
              </div>

              <form action={updateContentSection} className="mt-5 space-y-5">
                <input type="hidden" name="sectionKey" value={section.definition.key} />
                <input type="hidden" name="redirectTo" value="/admin/content" />

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <Label htmlFor={`${section.definition.key}-eyebrow`}>Eyebrow</Label>
                    <Input
                      id={`${section.definition.key}-eyebrow`}
                      name="eyebrow"
                      defaultValue={section.value.eyebrow}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`${section.definition.key}-display-order`}>Display order</Label>
                    <Input
                      id={`${section.definition.key}-display-order`}
                      name="displayOrder"
                      type="number"
                      defaultValue={section.displayOrder}
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Label htmlFor={`${section.definition.key}-heading`}>Heading</Label>
                    <Input
                      id={`${section.definition.key}-heading`}
                      name="heading"
                      defaultValue={section.value.heading}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`${section.definition.key}-body`}>Body</Label>
                  <Textarea
                    id={`${section.definition.key}-body`}
                    name="body"
                    defaultValue={section.value.body}
                    required
                  />
                </div>

                <ToggleField
                  defaultChecked={section.isActive}
                  label="Show this section on the public site"
                  name="isActive"
                />

                {Object.keys(section.value.settings).length > 0 ? (
                  <div className="rounded-[1.6rem] border border-charcoal/8 bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                      Section settings
                    </p>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      {Object.entries(section.value.settings).map(([key, value]) => {
                        const isLongField = key.toLowerCase().includes("quote") || key.toLowerCase().includes("accent");

                        return (
                          <div key={key} className={isLongField ? "lg:col-span-2" : undefined}>
                            <Label htmlFor={`${section.definition.key}-${key}`}>{getFieldLabel(key)}</Label>
                            {isLongField ? (
                              <Textarea
                                id={`${section.definition.key}-${key}`}
                                name={`setting.${key}`}
                                defaultValue={value}
                              />
                            ) : (
                              <Input
                                id={`${section.definition.key}-${key}`}
                                name={`setting.${key}`}
                                defaultValue={value}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {section.value.items.length > 0 ? (
                  <div className="rounded-[1.6rem] border border-charcoal/8 bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                      Repeatable items
                    </p>
                    <div className="mt-4 space-y-4">
                      {section.value.items.map((item, index) => (
                        <div
                          key={`${section.definition.key}-item-${index}`}
                          className="rounded-[1.4rem] border border-charcoal/8 bg-white px-4 py-4"
                        >
                          <p className="text-sm font-medium text-charcoal">Item {index + 1}</p>
                          <div className="mt-3 grid gap-4 lg:grid-cols-2">
                            {Object.entries(item).map(([key, value]) => {
                              const isLongField = key === "description" || key === "text";

                              return (
                                <div
                                  key={`${section.definition.key}-item-${index}-${key}`}
                                  className={isLongField ? "lg:col-span-2" : undefined}
                                >
                                  <Label htmlFor={`${section.definition.key}-item-${index}-${key}`}>
                                    {getFieldLabel(key)}
                                  </Label>
                                  {isLongField ? (
                                    <Textarea
                                      id={`${section.definition.key}-item-${index}-${key}`}
                                      name={`item.${index}.${key}`}
                                      defaultValue={value}
                                    />
                                  ) : (
                                    <Input
                                      id={`${section.definition.key}-item-${index}-${key}`}
                                      name={`item.${index}.${key}`}
                                      defaultValue={value}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <Button type="submit">Save {section.definition.title.toLowerCase()}</Button>
              </form>
            </article>
          ))}
        </div>
      </AdminSectionCard>
    </div>
  );
}
