import { updateContentSection, updateSiteSetting } from "@/app/admin/(protected)/content/actions";
import { AdminNoticeBanner } from "@/components/admin/admin-notice-banner";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [rawSearchParams, data] = await Promise.all([searchParams, getContentAdminData()]);
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

      <AdminSectionCard
        title="Website settings"
        description="These are the small brand and contact details that repeat across the site. Keeping them here makes updates safer than editing page-by-page."
      >
        <div className="grid gap-5 xl:grid-cols-2">
          {data.settings.map((setting) => (
            <article
              key={setting.definition.key}
              className="rounded-[1.8rem] border border-charcoal/10 bg-paper p-5"
            >
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  {setting.definition.label}
                </p>
                <p className="text-sm leading-7 text-charcoal/62">{setting.definition.description}</p>
              </div>

              <form action={updateSiteSetting} className="mt-5 space-y-4">
                <input type="hidden" name="settingKey" value={setting.definition.key} />
                <input type="hidden" name="redirectTo" value="/admin/content" />

                {setting.definition.fields.map((field) => (
                  <div key={field.key}>
                    <Label htmlFor={`${setting.definition.key}-${field.key}`}>{field.label}</Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        id={`${setting.definition.key}-${field.key}`}
                        name={`field.${field.key}`}
                        defaultValue={setting.value[field.key] ?? ""}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    ) : (
                      <Input
                        id={`${setting.definition.key}-${field.key}`}
                        name={`field.${field.key}`}
                        defaultValue={setting.value[field.key] ?? ""}
                        placeholder={field.placeholder}
                        required={field.required}
                        type={field.type}
                      />
                    )}
                  </div>
                ))}

                <Button type="submit">Save {setting.definition.label.toLowerCase()}</Button>
              </form>
            </article>
          ))}
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Structured sections"
        description="These forms only cover the sections already modeled for the live site. That keeps editing flexible enough for day-to-day changes without turning the app into an unrestricted CMS."
      >
        <div className="space-y-5">
          {data.sections.map((section) => (
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
                  label="Show this section on the live site"
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
