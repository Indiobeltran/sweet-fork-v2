import { saveAdminSetting } from "@/app/admin/(protected)/settings/actions";
import {
  resolveIntegrationConflict,
  updateIntegrationEnabled,
} from "@/app/admin/(protected)/settings/integration-actions";
import { AdminNoticeBanner } from "@/components/admin/admin-notice-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getSettingsAdminData,
  launchReadinessSections,
  type ManagedAdminSetting,
} from "@/lib/admin/settings";
import { getIntegrationHealthData } from "@/lib/admin/integrations";
import { requireAdmin } from "@/lib/auth";
import { formatOptionalDateTime } from "@/lib/admin/order-workflow";

export const metadata = {
  title: "Admin Settings",
};

type AdminSettingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getNoticeValue(rawSearchParams: Record<string, string | string[] | undefined>) {
  const noticeValue = rawSearchParams.notice;
  return Array.isArray(noticeValue) ? noticeValue[0] : noticeValue;
}

function getBookingNoticePreviewClasses(tone: string) {
  switch (tone) {
    case "closed":
      return "border-rose/24 bg-rose/10 text-charcoal";
    case "limited":
      return "border-gold/24 bg-gold/12 text-charcoal";
    default:
      return "border-charcoal/10 bg-white text-charcoal/78";
  }
}

function SettingCard({ setting }: Readonly<{ setting: ManagedAdminSetting }>) {
  const bookingNoticeEnabled =
    setting.definition.key === "booking.notice" && setting.value.enabled === true;
  const bookingTone = typeof setting.value.tone === "string" ? setting.value.tone : "info";
  const bookingTitle = typeof setting.value.title === "string" ? setting.value.title : "";
  const bookingMessage = typeof setting.value.message === "string" ? setting.value.message : "";

  return (
    <article className="rounded-[1.8rem] border border-charcoal/10 bg-paper p-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
          {setting.definition.label}
        </p>
        <p className="text-sm leading-7 text-charcoal/62">{setting.definition.description}</p>
      </div>

      <form action={saveAdminSetting} className="mt-5 space-y-4">
        <input type="hidden" name="settingKey" value={setting.definition.key} />
        <input type="hidden" name="redirectTo" value="/admin/settings" />

        {setting.definition.fields.map((field) => {
          const fieldValue = setting.value[field.key];

          if (field.type === "boolean") {
            return (
              <label
                key={field.key}
                className="flex items-start gap-3 rounded-2xl border border-charcoal/10 bg-white/80 px-4 py-3 text-sm text-charcoal/74"
              >
                <input
                  type="checkbox"
                  name={`field.${field.key}`}
                  defaultChecked={fieldValue === true}
                  className="mt-1 h-4 w-4 rounded border-charcoal/20 text-charcoal focus:ring-gold/20"
                />
                <span>
                  <span className="block font-medium text-charcoal">{field.label}</span>
                  {field.helpText ? <span className="mt-1 block text-charcoal/62">{field.helpText}</span> : null}
                </span>
              </label>
            );
          }

          if (field.type === "select") {
            return (
              <div key={field.key}>
                <Label htmlFor={`${setting.definition.key}-${field.key}`}>{field.label}</Label>
                <Select
                  id={`${setting.definition.key}-${field.key}`}
                  name={`field.${field.key}`}
                  defaultValue={typeof fieldValue === "string" ? fieldValue : ""}
                >
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                {field.helpText ? (
                  <p className="mt-2 text-sm leading-7 text-charcoal/58">{field.helpText}</p>
                ) : null}
              </div>
            );
          }

          return (
            <div key={field.key}>
              <Label htmlFor={`${setting.definition.key}-${field.key}`}>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={`${setting.definition.key}-${field.key}`}
                  name={`field.${field.key}`}
                  defaultValue={typeof fieldValue === "string" ? fieldValue : ""}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              ) : (
                <Input
                  id={`${setting.definition.key}-${field.key}`}
                  name={`field.${field.key}`}
                  defaultValue={typeof fieldValue === "string" ? fieldValue : ""}
                  placeholder={field.placeholder}
                  required={field.required}
                  type={field.type}
                />
              )}
              {field.helpText ? <p className="mt-2 text-sm leading-7 text-charcoal/58">{field.helpText}</p> : null}
            </div>
          );
        })}

        {bookingNoticeEnabled ? (
          <div className={`rounded-[1.5rem] border px-4 py-4 ${getBookingNoticePreviewClasses(bookingTone)}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Preview</p>
            <h3 className="mt-2 font-serif text-2xl tracking-[-0.03em]">{bookingTitle}</h3>
            <p className="mt-2 text-sm leading-7">{bookingMessage}</p>
          </div>
        ) : null}

        <Button type="submit">Save {setting.definition.label.toLowerCase()}</Button>
      </form>
    </article>
  );
}

export default async function AdminSettingsPage({ searchParams }: AdminSettingsPageProps) {
  const rawSearchParams = await searchParams;
  const [notice, data, integrationData, admin] = await Promise.all([
    Promise.resolve(getNoticeValue(rawSearchParams)),
    getSettingsAdminData(),
    getIntegrationHealthData(),
    requireAdmin(),
  ]);

  return (
    <div className="space-y-4">
      <AdminNoticeBanner
        notice={notice}
        notices={{
          "settings-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "The setting could not be saved. Please review the fields and try again.",
          },
          "settings-updated": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Settings updated.",
          },
          "integration-disabled": {
            className: "border-gold/24 bg-gold/12 text-charcoal",
            text: "Integration disabled. Existing external records were preserved.",
          },
          "integration-enabled": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Integration enabled. Verify its first live synchronization before relying on it.",
          },
          "integration-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "The integration setting could not be updated.",
          },
          "integration-conflict-resolved": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Integration conflict reviewed.",
          },
        }}
      />

      <AdminPageHeader
        hideTitleOnMobile
        title="Settings"
        description="Business defaults, inquiry controls, and booking notices used across the public site."
      >
        <div className="flex flex-wrap gap-2">
          {data.summary.map((item) => (
            <span
              key={item.label}
              className="rounded-full border border-charcoal/8 bg-white/84 px-3 py-1 text-xs text-charcoal/64"
            >
              <span className="font-semibold text-charcoal">{item.value}</span> {item.label}
            </span>
          ))}
        </div>
      </AdminPageHeader>

      {data.sections.map((section) => (
        <AdminSectionCard key={section.key} title={section.title} description={section.description}>
          <div className="grid gap-5 xl:grid-cols-2">
            {section.settings.map((setting) => (
              <SettingCard key={setting.definition.key} setting={setting} />
            ))}
          </div>
        </AdminSectionCard>
      ))}

      <AdminSectionCard
        title="Integrations"
        description="Private provider health, synchronization activity, and conflicts. Environment flags remain the final safety switch."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {integrationData.integrations.length === 0 ? (
            <p className="rounded-[1.35rem] border border-gold/20 bg-gold/10 p-4 text-sm text-charcoal/70 xl:col-span-2">
              Integration controls will appear after the reviewed database migration is applied. No provider is active.
            </p>
          ) : null}
          {integrationData.integrations.map((integration) => (
            <article key={integration.provider} className="rounded-[1.7rem] border border-charcoal/10 bg-paper p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                    {integration.mode}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl tracking-[-0.03em] text-charcoal">
                    {integration.displayName}
                  </h3>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${integration.status === "ready" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : integration.status === "error" ? "border-rose/24 bg-rose/10 text-charcoal" : "border-charcoal/10 bg-white text-charcoal/68"}`}>
                  {integration.status}
                </span>
              </div>
              <dl className="mt-4 grid gap-2 text-sm text-charcoal/64 sm:grid-cols-2">
                <div><dt className="font-medium text-charcoal">Credentials</dt><dd>{integration.configured ? "Configured" : "Missing"}</dd></div>
                <div><dt className="font-medium text-charcoal">Environment flag</dt><dd>{integration.environmentEnabled ? "Enabled" : "Disabled"}</dd></div>
                <div><dt className="font-medium text-charcoal">Last success</dt><dd>{formatOptionalDateTime(integration.lastSuccessAt)}</dd></div>
                <div><dt className="font-medium text-charcoal">Last event</dt><dd>{formatOptionalDateTime(integration.lastEventAt)}</dd></div>
                <div><dt className="font-medium text-charcoal">Open conflicts</dt><dd>{integration.openConflictCount}</dd></div>
                <div><dt className="font-medium text-charcoal">Recent failures</dt><dd>{integration.recentFailedEventCount}</dd></div>
              </dl>
              {integration.lastErrorCode ? <p className="mt-3 text-sm text-rose-800">Last error: {integration.lastErrorCode}</p> : null}
              {admin.role === "owner" ? (
                <form action={updateIntegrationEnabled} className="mt-4">
                  <input type="hidden" name="provider" value={integration.provider} />
                  <input type="hidden" name="enabled" value={String(!integration.enabled)} />
                  <Button type="submit" variant="secondary" size="sm" disabled={!integration.configured || !integration.environmentEnabled}>
                    {integration.enabled ? "Disable" : "Enable"}
                  </Button>
                </form>
              ) : null}
            </article>
          ))}
        </div>

        {integrationData.conflicts.length > 0 ? (
          <div className="mt-5 space-y-3">
            <h3 className="font-serif text-2xl text-charcoal">Open synchronization conflicts</h3>
            {integrationData.conflicts.map((conflict) => (
              <article key={conflict.id} className="rounded-[1.4rem] border border-gold/25 bg-gold/8 p-4">
                <p className="font-medium text-charcoal">{conflict.provider} · {conflict.conflictType}</p>
                <p className="mt-1 text-sm text-charcoal/64">
                  {conflict.fieldName ?? "Linked record"} · detected {formatOptionalDateTime(conflict.detectedAt)}
                </p>
                <form action={resolveIntegrationConflict} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="conflictId" value={conflict.id} />
                  <Button type="submit" name="resolution" value="resolved" size="sm">Mark reviewed</Button>
                  <Button type="submit" name="resolution" value="ignored" size="sm" variant="secondary">Ignore</Button>
                </form>
              </article>
            ))}
          </div>
        ) : null}
      </AdminSectionCard>

      <AdminSectionCard
        title="Launch readiness"
        description="Operational notes for launch and handoff."
        collapsible
        defaultOpen={false}
      >
        <div className="grid gap-5 xl:grid-cols-3">
          {launchReadinessSections.map((section) => (
            <article
              key={section.title}
              className="rounded-[1.7rem] border border-charcoal/10 bg-paper p-5"
            >
              <h3 className="font-serif text-2xl tracking-[-0.03em] text-charcoal">{section.title}</h3>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-charcoal/64">
                {section.items.map((item) => (
                  <li key={item} className="rounded-2xl border border-charcoal/8 bg-white/80 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-[1.6rem] border border-charcoal/10 bg-white/80 px-5 py-4 text-sm leading-7 text-charcoal/64">
          A matching repo note lives in <code>docs/phase-8-launch-readiness.md</code> for a fuller handoff outside the admin UI.
        </div>
      </AdminSectionCard>
    </div>
  );
}
