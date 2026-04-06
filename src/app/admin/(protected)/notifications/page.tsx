import Link from "next/link";

import { updateNotificationEventState } from "@/app/admin/(protected)/notifications/actions";
import { AdminNoticeBanner } from "@/components/admin/admin-notice-banner";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  getNotificationsAdminData,
  parseNotificationFilters,
  type NotificationEventEntry,
  type NotificationLogEntry,
} from "@/lib/admin/notifications";

export const metadata = {
  title: "Admin Notifications",
};

type AdminNotificationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getNoticeValue(rawSearchParams: Record<string, string | string[] | undefined>) {
  const noticeValue = rawSearchParams.notice;
  return Array.isArray(noticeValue) ? noticeValue[0] : noticeValue;
}

function getStatusClasses(status: NotificationLogEntry["status"]) {
  switch (status) {
    case "sent":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "failed":
      return "border-rose/24 bg-rose/10 text-charcoal";
    case "skipped":
      return "border-stone/18 bg-stone/10 text-charcoal";
    default:
      return "border-gold/24 bg-gold/12 text-charcoal";
  }
}

function getChannelClasses(channel: NotificationLogEntry["channel"]) {
  switch (channel) {
    case "email":
      return "border-charcoal/10 bg-white text-charcoal/74";
    case "sms":
      return "border-sky-200 bg-sky-50 text-sky-900";
    default:
      return "border-gold/24 bg-gold/12 text-charcoal";
  }
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatJson(value: unknown) {
  const formatted = JSON.stringify(value, null, 2);
  return formatted === "{}" || formatted === "[]" ? null : formatted;
}

function EventCard({
  event,
  redirectTo,
}: Readonly<{
  event: NotificationEventEntry;
  redirectTo: string;
}>) {
  return (
    <article className="rounded-[1.7rem] border border-charcoal/10 bg-paper p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-charcoal/10 bg-white px-3 py-1 text-xs text-charcoal/72">
              {event.categoryKey}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                event.isActive
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-stone/18 bg-stone/10 text-charcoal"
              }`}
            >
              {event.isActive ? "Active" : "Paused"}
            </span>
          </div>

          <div>
            <h3 className="font-serif text-2xl tracking-[-0.03em] text-charcoal">
              {event.eventKey}
            </h3>
            <p className="mt-1 text-sm leading-7 text-charcoal/62">
              {event.description ?? "No event description has been saved yet."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {event.defaultChannels.length > 0 ? (
              event.defaultChannels.map((channel) => (
                <span
                  key={channel}
                  className="rounded-full border border-charcoal/8 bg-white/80 px-3 py-1 text-xs text-charcoal/72"
                >
                  {channel}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-charcoal/8 bg-white/80 px-3 py-1 text-xs text-charcoal/72">
                No default channels
              </span>
            )}
            {event.templateKey ? (
              <span className="rounded-full border border-charcoal/8 bg-white/80 px-3 py-1 text-xs text-charcoal/72">
                Template: {event.templateKey}
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[1.4rem] border border-charcoal/8 bg-white/80 px-4 py-3 text-sm text-charcoal/66">
            <p>{event.recentLogCount} recent log rows</p>
            <p className="mt-1">{event.recentFailureCount} failures</p>
            <p className="mt-1">
              Last activity: {event.lastLoggedAt ? formatDateTime(event.lastLoggedAt) : "No logs yet"}
            </p>
          </div>

          <form action={updateNotificationEventState}>
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="isActive" value={String(!event.isActive)} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <Button type="submit" variant="secondary" size="sm">
              {event.isActive ? "Pause event" : "Reactivate event"}
            </Button>
          </form>
        </div>
      </div>
    </article>
  );
}

function LogCard({ log }: Readonly<{ log: NotificationLogEntry }>) {
  const payload = formatJson(log.payload);
  const responseJson = formatJson(log.responseJson);

  return (
    <article className="rounded-[1.8rem] border border-charcoal/10 bg-white/88 p-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusClasses(log.status)}`}
            >
              {log.status}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${getChannelClasses(log.channel)}`}
            >
              {log.channel}
            </span>
            {log.eventKey ? (
              <span className="rounded-full border border-charcoal/8 bg-ivory/70 px-3 py-1 text-xs text-charcoal/72">
                {log.eventKey}
              </span>
            ) : null}
          </div>

          <div>
            <h3 className="font-serif text-2xl tracking-[-0.03em] text-charcoal">
              {log.subject ?? "Untitled notification"}
            </h3>
            <p className="mt-1 text-sm leading-7 text-charcoal/62">Recipient: {log.recipient}</p>
            {log.relatedLabel ? (
              log.relatedHref ? (
                <p className="text-sm leading-7 text-charcoal/62">
                  Related:{" "}
                  <Link href={log.relatedHref} className="underline decoration-charcoal/20 underline-offset-4">
                    {log.relatedLabel}
                  </Link>
                </p>
              ) : (
                <p className="text-sm leading-7 text-charcoal/62">Related: {log.relatedLabel}</p>
              )
            ) : null}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-charcoal/8 bg-ivory/70 p-4 text-sm text-charcoal/66">
          <p>Created: {formatDateTime(log.createdAt)}</p>
          <p className="mt-2">Attempted: {formatDateTime(log.attemptedAt)}</p>
          <p className="mt-2">Sent: {formatDateTime(log.sentAt)}</p>
          {log.categoryKey ? <p className="mt-2">Category: {log.categoryKey}</p> : null}
        </div>
      </div>

      {log.errorMessage ? (
        <div className="mt-4 rounded-[1.4rem] border border-rose/24 bg-rose/10 px-4 py-3 text-sm text-charcoal">
          {log.errorMessage}
        </div>
      ) : null}

      {payload || responseJson ? (
        <details className="mt-4 rounded-[1.4rem] border border-charcoal/8 bg-paper/70 px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-charcoal">
            Payload and delivery details
          </summary>
          <div className="mt-4 space-y-4">
            {payload ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Payload
                </p>
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-charcoal/8 bg-white/80 p-4 text-xs leading-6 text-charcoal/72">
                  {payload}
                </pre>
              </div>
            ) : null}

            {responseJson ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Response
                </p>
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-charcoal/8 bg-white/80 p-4 text-xs leading-6 text-charcoal/72">
                  {responseJson}
                </pre>
              </div>
            ) : null}
          </div>
        </details>
      ) : null}
    </article>
  );
}

export default async function AdminNotificationsPage({
  searchParams,
}: AdminNotificationsPageProps) {
  const rawSearchParams = await searchParams;
  const filters = parseNotificationFilters(rawSearchParams);
  const [notice, data] = await Promise.all([
    Promise.resolve(getNoticeValue(rawSearchParams)),
    getNotificationsAdminData(filters),
  ]);
  const redirectTo = `/admin/notifications${filters.search || filters.status !== "all" || filters.channel !== "all" ? `?${new URLSearchParams(
    Object.entries({
      channel: filters.channel !== "all" ? filters.channel : "",
      search: filters.search,
      status: filters.status !== "all" ? filters.status : "",
    }).filter(([, value]) => value),
  ).toString()}` : ""}`;

  return (
    <div className="space-y-6">
      <AdminNoticeBanner
        notice={notice}
        notices={{
          "notifications-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "The notification change could not be saved. Please try again.",
          },
          "notifications-updated": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Notification event updated.",
          },
        }}
      />

      <section className="grid gap-4 lg:grid-cols-4">
        {data.summary.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.9rem] border border-charcoal/10 bg-white/88 p-5 shadow-soft"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
              {item.label}
            </p>
            <p className="mt-3 font-serif text-4xl tracking-[-0.04em] text-charcoal">
              {item.value}
            </p>
            <p className="mt-2 text-sm leading-7 text-charcoal/62">{item.detail}</p>
          </div>
        ))}
      </section>

      <AdminSectionCard
        title="Notification events"
        description="This page is intentionally internal-facing. It shows what the app knows about notification events and what was logged as sent, pending, failed, or skipped. It is visibility first, not a full automation console."
      >
        <div className="space-y-4">
          {data.events.length > 0 ? (
            data.events.map((event) => (
              <EventCard key={event.id} event={event} redirectTo={redirectTo} />
            ))
          ) : (
            <div className="rounded-[1.6rem] border border-dashed border-charcoal/12 bg-paper/60 px-5 py-6 text-sm leading-7 text-charcoal/62">
              No notification events have been recorded yet.
            </div>
          )}
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Delivery history"
        description="Recent logs are loaded from the existing notification tables so the bakery team can see what the app recorded without opening the database."
      >
        <div className="rounded-[1.7rem] border border-charcoal/10 bg-paper p-5">
          <form className="grid gap-4 lg:grid-cols-4">
            <div>
              <Label htmlFor="notification-search">Search</Label>
              <Input
                id="notification-search"
                name="search"
                defaultValue={filters.search}
                placeholder="Recipient, subject, event key"
              />
            </div>

            <div>
              <Label htmlFor="notification-status">Status</Label>
              <Select id="notification-status" name="status" defaultValue={filters.status}>
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="skipped">Skipped</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="notification-channel">Channel</Label>
              <Select id="notification-channel" name="channel" defaultValue={filters.channel}>
                <option value="all">All channels</option>
                <option value="internal">Internal</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </Select>
            </div>

            <div className="flex items-end gap-3">
              <Button type="submit">Apply filters</Button>
              <Link
                href="/admin/notifications"
                className="inline-flex h-12 items-center justify-center rounded-full border border-charcoal/15 bg-ivory/80 px-5 text-sm font-medium tracking-[0.02em] text-charcoal transition hover:border-charcoal/40 hover:bg-white"
              >
                Clear
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-6 space-y-4">
          {data.logs.length > 0 ? (
            data.logs.map((log) => <LogCard key={log.id} log={log} />)
          ) : (
            <div className="rounded-[1.6rem] border border-dashed border-charcoal/12 bg-paper/60 px-5 py-6 text-sm leading-7 text-charcoal/62">
              No log rows matched this filter. The page currently loads up to the {data.totalLogCount} most recent log row
              {data.totalLogCount === 1 ? "" : "s"} for practical review.
            </div>
          )}
        </div>
      </AdminSectionCard>
    </div>
  );
}
