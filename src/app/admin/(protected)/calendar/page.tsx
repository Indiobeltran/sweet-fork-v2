import Link from "next/link";

import {
  createBlackoutDate,
  createCalendarEntry,
  toggleBlackoutDateState,
} from "@/app/admin/(protected)/calendar/actions";
import { AdminNoticeBanner } from "@/components/admin/admin-notice-banner";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getCalendarPageData,
  parseCalendarFilters,
  type CalendarAgendaItem,
  type CalendarDayItem,
} from "@/lib/admin/calendar";
import { cn, toTitleCase } from "@/lib/utils";

export const metadata = {
  title: "Admin Calendar",
};

type AdminCalendarPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const calendarEntryTypeOptions = [
  "consultation",
  "tasting",
  "pickup",
  "delivery",
  "order-deadline",
  "task",
  "personal",
  "holiday",
] as const;

function getNoticeValue(rawSearchParams: Record<string, string | string[] | undefined>) {
  const noticeValue = rawSearchParams.notice;
  return Array.isArray(noticeValue) ? noticeValue[0] : noticeValue;
}

function getToneDotClasses(tone: CalendarDayItem["tone"]) {
  switch (tone) {
    case "emerald":
      return "bg-emerald-500";
    case "gold":
      return "bg-gold";
    case "rose":
      return "bg-rose";
    default:
      return "bg-charcoal/60";
  }
}

function getItemClasses(item: Pick<CalendarDayItem, "kind" | "tone">) {
  if (item.kind === "blackout") {
    return "border-rose/24 bg-rose/10 text-charcoal";
  }

  switch (item.tone) {
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "gold":
      return "border-gold/24 bg-gold/12 text-charcoal";
    case "rose":
      return "border-rose/24 bg-rose/10 text-charcoal";
    default:
      return "border-charcoal/10 bg-white text-charcoal/78";
  }
}

function AgendaRow({ item }: Readonly<{ item: CalendarAgendaItem }>) {
  const content = (
    <article className="rounded-[1.6rem] border border-charcoal/10 bg-white/88 p-4 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getItemClasses(item)}`}
            >
              {toTitleCase(item.kind)}
            </span>
            <span className="rounded-full border border-charcoal/8 bg-ivory/75 px-3 py-1 text-xs text-charcoal/68">
              {item.dateLabel}
            </span>
            {item.timeLabel ? (
              <span className="rounded-full border border-charcoal/8 bg-ivory/75 px-3 py-1 text-xs text-charcoal/68">
                {item.timeLabel}
              </span>
            ) : null}
          </div>

          <div>
            <h3 className="font-serif text-2xl tracking-[-0.03em] text-charcoal">{item.title}</h3>
            <p className="mt-1 text-sm leading-7 text-charcoal/64">{item.subtitle}</p>
          </div>
        </div>

        {item.href ? (
          <span className="inline-flex items-center rounded-full border border-charcoal/12 bg-ivory/70 px-4 py-2 text-sm text-charcoal/72">
            Open record
          </span>
        ) : null}
      </div>
    </article>
  );

  if (!item.href) {
    return content;
  }

  return (
    <Link href={item.href} className="block transition hover:-translate-y-0.5">
      {content}
    </Link>
  );
}

export default async function AdminCalendarPage({ searchParams }: AdminCalendarPageProps) {
  const rawSearchParams = await searchParams;
  const filters = parseCalendarFilters(rawSearchParams);
  const [notice, data] = await Promise.all([
    Promise.resolve(getNoticeValue(rawSearchParams)),
    getCalendarPageData(filters),
  ]);
  const defaultDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <AdminNoticeBanner
        notice={notice}
        notices={{
          "calendar-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "The calendar update could not be saved. Please review the fields and try again.",
          },
          "calendar-updated": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Calendar information updated.",
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
        title="Operational calendar"
        description="This view stays practical on purpose: order dates, inquiry pressure, blackout ranges, and any manual all-day notes all land in one calm monthly calendar."
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
              Month in view
            </p>
            <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-charcoal">
              {data.monthLabel}
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/admin/calendar?month=${data.previousMonthKey}`}
              className="inline-flex h-12 w-full items-center justify-center rounded-full border border-charcoal/15 bg-ivory/80 px-5 text-sm font-medium tracking-[0.02em] text-charcoal transition hover:border-charcoal/40 hover:bg-white sm:w-auto"
            >
              Previous month
            </Link>
            <Link
              href={`/admin/calendar?month=${data.nextMonthKey}`}
              className="inline-flex h-12 w-full items-center justify-center rounded-full border border-charcoal/15 bg-ivory/80 px-5 text-sm font-medium tracking-[0.02em] text-charcoal transition hover:border-charcoal/40 hover:bg-white sm:w-auto"
            >
              Next month
            </Link>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-rose/24 bg-rose/10 px-3 py-1 text-xs text-charcoal">
            Blackout
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-900">
            Confirmed order
          </span>
          <span className="rounded-full border border-gold/24 bg-gold/12 px-3 py-1 text-xs text-charcoal">
            New or quoted inquiry
          </span>
          <span className="rounded-full border border-charcoal/10 bg-white px-3 py-1 text-xs text-charcoal/74">
            Manual note
          </span>
        </div>

        <div className="mt-6 md:hidden">
          <div className="grid grid-cols-7 gap-2">
            {weekdayLabels.map((label) => (
              <div
                key={`mobile-${label}`}
                className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal/42"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {data.days.map((day) => (
              <article
                key={`mobile-${day.dateKey}`}
                aria-label={`${day.dateKey}, ${day.items.length} item${day.items.length === 1 ? "" : "s"}`}
                className={cn(
                  "flex aspect-[0.94] min-w-0 flex-col rounded-[1rem] border px-2 py-2",
                  day.isCurrentMonth
                    ? "border-charcoal/10 bg-white/88"
                    : "border-charcoal/6 bg-paper/70 text-charcoal/45",
                  day.isToday ? "ring-2 ring-gold/30" : "",
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-sm font-semibold text-current">{day.dayOfMonth}</span>
                  {day.items.length > 0 ? (
                    <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-current/58">
                      {day.items.length}
                    </span>
                  ) : null}
                </div>
                <div className="mt-auto flex flex-wrap gap-1">
                  {day.items.slice(0, 3).map((item, index) => (
                    <span
                      key={`${day.dateKey}-${item.id}-${index}`}
                      className={cn("h-2 w-2 rounded-full", getToneDotClasses(item.tone))}
                    />
                  ))}
                  {day.items.length > 3 ? (
                    <span className="text-[10px] text-charcoal/52">+{day.items.length - 3}</span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <p className="mt-3 text-sm leading-7 text-charcoal/60">
            Color dots mirror the legend above. Use the agenda below for names, notes, and direct
            record links.
          </p>
        </div>

        <div className="mt-6 hidden overflow-x-auto md:block">
          <div className="min-w-[70rem]">
            <div className="grid grid-cols-7 gap-3">
              {weekdayLabels.map((label) => (
                <div
                  key={label}
                  className="rounded-[1.2rem] border border-charcoal/8 bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-7 gap-3">
              {data.days.map((day) => (
                <article
                  key={day.dateKey}
                  className={cn(
                    "min-h-[12rem] rounded-[1.7rem] border p-3 shadow-soft",
                    day.isCurrentMonth
                      ? "border-charcoal/10 bg-white/88"
                      : "border-charcoal/6 bg-paper/70 text-charcoal/50",
                    day.isToday ? "ring-2 ring-gold/30" : "",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-charcoal/74">{day.dayOfMonth}</span>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-charcoal/42">
                      {day.items.length} item{day.items.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {day.items.slice(0, 4).map((item) => (
                      <div
                        key={`${day.dateKey}-${item.kind}-${item.id}`}
                        className={`rounded-2xl border px-3 py-2 text-xs leading-5 ${getItemClasses(item)}`}
                      >
                        <div className="font-medium">{item.title}</div>
                        <div className="text-[11px] text-current/80">
                          {item.timeLabel ? `${item.timeLabel} • ` : ""}
                          {item.subtitle}
                        </div>
                      </div>
                    ))}

                    {day.items.length > 4 ? (
                      <p className="text-xs text-charcoal/55">+{day.items.length - 4} more items</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </AdminSectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,0.9fr)]">
        <AdminSectionCard
          title="Upcoming agenda"
          description="Use this as the quick operational sweep: upcoming dates, manual notes, and blackout windows all in one ordered list."
        >
          <div className="space-y-4">
            {data.agenda.length > 0 ? (
              data.agenda.map((item) => <AgendaRow key={`${item.kind}-${item.id}-${item.dateKey}`} item={item} />)
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-charcoal/12 bg-paper/60 px-5 py-6 text-sm leading-7 text-charcoal/62">
                Nothing is scheduled in the current month window yet.
              </div>
            )}
          </div>
        </AdminSectionCard>

        <div className="space-y-6">
          <AdminSectionCard
            title="Blocked dates"
            description="Blackout dates are for vacations, sold-out weekends, family events, or any days that should stay unavailable."
          >
            <div className="space-y-4">
              {data.blackoutWindows.length > 0 ? (
                data.blackoutWindows.map((blackout) => (
                  <article
                    key={blackout.id}
                    className="rounded-[1.5rem] border border-charcoal/10 bg-paper p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-rose/24 bg-rose/10 px-3 py-1 text-xs font-medium text-charcoal">
                            {blackout.isActive ? "Active" : "Paused"}
                          </span>
                          <span className="rounded-full border border-charcoal/8 bg-white/80 px-3 py-1 text-xs text-charcoal/68">
                            {toTitleCase(blackout.scope)}
                          </span>
                        </div>
                        <h3 className="font-medium text-charcoal">{blackout.reason}</h3>
                        <p className="text-sm text-charcoal/62">{blackout.dateLabel}</p>
                        {blackout.notes ? (
                          <p className="text-sm leading-7 text-charcoal/62">{blackout.notes}</p>
                        ) : null}
                      </div>

                      <form action={toggleBlackoutDateState}>
                        <input type="hidden" name="blackoutId" value={blackout.id} />
                        <input type="hidden" name="isActive" value={String(!blackout.isActive)} />
                        <input type="hidden" name="redirectTo" value={`/admin/calendar?month=${filters.month}`} />
                        <Button type="submit" variant="secondary" size="sm">
                          {blackout.isActive ? "Pause block" : "Reactivate"}
                        </Button>
                      </form>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-charcoal/12 bg-paper/60 px-5 py-6 text-sm leading-7 text-charcoal/62">
                  No blackout dates overlap this calendar window.
                </div>
              )}
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            title="Add blackout"
            description="Block days or date ranges without opening a bigger scheduling system."
          >
            <form action={createBlackoutDate} className="space-y-4">
              <input type="hidden" name="redirectTo" value={`/admin/calendar?month=${filters.month}`} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="blackout-starts-on">Starts on</Label>
                  <Input id="blackout-starts-on" name="startsOn" type="date" defaultValue={defaultDate} required />
                </div>
                <div>
                  <Label htmlFor="blackout-ends-on">Ends on</Label>
                  <Input id="blackout-ends-on" name="endsOn" type="date" defaultValue={defaultDate} required />
                </div>
              </div>

              <div>
                <Label htmlFor="blackout-scope">Scope</Label>
                <Select id="blackout-scope" name="scope" defaultValue="all">
                  <option value="all">All bookings</option>
                  <option value="pickup">Pickup only</option>
                  <option value="delivery">Delivery only</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="blackout-reason">Reason</Label>
                <Input id="blackout-reason" name="reason" placeholder="Sold out weekend" required />
              </div>

              <div>
                <Label htmlFor="blackout-notes">Internal notes</Label>
                <Textarea id="blackout-notes" name="notes" placeholder="Optional context for the bakery team" />
              </div>

              <Button type="submit">Save blackout</Button>
            </form>
          </AdminSectionCard>

          <AdminSectionCard
            title="Add all-day note"
            description="Manual reminders stay intentionally light here: deadlines, tastings, family events, or anything else the bakery should keep visible."
          >
            <form action={createCalendarEntry} className="space-y-4">
              <input type="hidden" name="redirectTo" value={`/admin/calendar?month=${filters.month}`} />

              <div>
                <Label htmlFor="calendar-title">Title</Label>
                <Input id="calendar-title" name="title" placeholder="Wedding tasting" required />
              </div>

              <div>
                <Label htmlFor="calendar-entry-type">Type</Label>
                <Select id="calendar-entry-type" name="entryType" defaultValue="task">
                  {calendarEntryTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {toTitleCase(option)}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="calendar-starts-on">Starts on</Label>
                  <Input id="calendar-starts-on" name="startsOn" type="date" defaultValue={defaultDate} required />
                </div>
                <div>
                  <Label htmlFor="calendar-ends-on">Ends on</Label>
                  <Input id="calendar-ends-on" name="endsOn" type="date" defaultValue={defaultDate} />
                </div>
              </div>

              <div>
                <Label htmlFor="calendar-location">Location</Label>
                <Input id="calendar-location" name="locationText" placeholder="Bakery kitchen or venue name" />
              </div>

              <div>
                <Label htmlFor="calendar-notes">Notes</Label>
                <Textarea id="calendar-notes" name="notes" placeholder="Optional prep or timing context" />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-charcoal/10 bg-ivory/55 px-4 py-3 text-sm text-charcoal/74">
                <input
                  type="checkbox"
                  name="isPrivate"
                  className="h-4 w-4 rounded border-charcoal/20 text-charcoal focus:ring-gold/20"
                />
                <span>Keep this internal/private</span>
              </label>

              <Button type="submit">Save all-day note</Button>
            </form>
          </AdminSectionCard>
        </div>
      </div>
    </div>
  );
}
