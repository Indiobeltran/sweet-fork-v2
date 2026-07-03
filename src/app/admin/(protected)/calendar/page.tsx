import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import {
  createBlackoutDate,
  createCalendarEntry,
  toggleBlackoutDateState,
  updateWeeklyCapacityCeiling,
} from "@/app/admin/(protected)/calendar/actions";
import { ActiveFilterPills } from "@/components/admin/active-filter-pills";
import { AdminNoticeBanner } from "@/components/admin/admin-notice-banner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { CompactEmptyState } from "@/components/admin/compact-empty-state";
import { FilterSheet } from "@/components/admin/filter-sheet";
import { StatusChipRow } from "@/components/admin/status-chip-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getCalendarPageData,
  parseCalendarFilters,
  type CalendarAgendaItem,
  type CalendarDay,
  type CalendarDayItem,
  type CalendarPageData,
} from "@/lib/admin/calendar";
import type { CapacityLoadState } from "@/lib/admin/capacity";
import { cn, toTitleCase } from "@/lib/utils";
import { InteractiveCalendar } from "@/components/admin/interactive-calendar";

export const metadata = {
  title: "Admin Calendar",
};

type AdminCalendarPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type CalendarView = "blackouts" | "month" | "notes" | "week";

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
const calendarViewLabels: Record<CalendarView, string> = {
  blackouts: "Blackouts",
  month: "Month",
  notes: "Notes",
  week: "Week",
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getNoticeValue(rawSearchParams: Record<string, string | string[] | undefined>) {
  return getSearchValue(rawSearchParams.notice);
}

function getCalendarView(
  rawSearchParams: Record<string, string | string[] | undefined>,
): CalendarView {
  const rawView = getSearchValue(rawSearchParams.view);

  if (rawView === "week" || rawView === "blackouts" || rawView === "notes") {
    return rawView;
  }

  return "month";
}

function buildCalendarHref(month: string, view: CalendarView = "month") {
  const searchParams = new URLSearchParams({
    month,
  });

  if (view !== "month") {
    searchParams.set("view", view);
  }

  return `/admin/calendar?${searchParams.toString()}`;
}

function formatShortDateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function formatWeekRangeLabel(days: CalendarDay[]) {
  if (days.length === 0) {
    return "";
  }

  const first = days[0]?.dateKey;
  const last = days[days.length - 1]?.dateKey;

  if (!first || !last) {
    return "";
  }

  return `${formatShortDateLabel(first)} - ${formatShortDateLabel(last)}`;
}

function formatWeekdayLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function getActiveWeekDays(days: CalendarDay[]) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const currentIndex = days.findIndex((day) => day.dateKey === todayKey && day.isCurrentMonth);
  const fallbackIndex = days.findIndex((day) => day.isCurrentMonth);
  const startIndex = currentIndex >= 0 ? currentIndex : fallbackIndex >= 0 ? fallbackIndex : 0;
  const weekStart = Math.floor(startIndex / 7) * 7;

  return days.slice(weekStart, weekStart + 7);
}



function getLoadStateLabel(state: CapacityLoadState) {
  switch (state) {
    case "light":
      return "Light";
    case "moderate":
      return "Moderate";
    case "full":
      return "Full";
    case "overbooked":
      return "Overbooked";
    default:
      return "No load";
  }
}

function getLoadBarClasses(state: CapacityLoadState) {
  switch (state) {
    case "light":
      return "bg-emerald-400";
    case "moderate":
      return "bg-gold";
    case "full":
      return "bg-rose/55";
    case "overbooked":
      return "bg-rose";
    default:
      return "bg-charcoal/12";
  }
}

function getLoadCellClasses(state: CapacityLoadState) {
  switch (state) {
    case "light":
      return "border-emerald-200 bg-emerald-50/75";
    case "moderate":
      return "border-gold/35 bg-gold/16";
    case "full":
      return "border-rose/30 bg-rose/12";
    case "overbooked":
      return "border-rose/55 bg-rose/20";
    default:
      return "border-charcoal/10 bg-white/88";
  }
}

function getCapacityPercent(points: number, ceiling: number) {
  if (ceiling <= 0) {
    return 0;
  }

  return Math.min(Math.round((points / ceiling) * 100), 100);
}

function getDayCapacityLabel(day: CalendarDay) {
  return `${day.dateKey}: ${day.capacity.orderPoints} points (${day.capacity.duePoints} due, ${day.capacity.prepPoints} prep), ${day.capacity.orderCount} confirmed order${day.capacity.orderCount === 1 ? "" : "s"} due, ${day.capacity.inquiryCount} active inquir${day.capacity.inquiryCount === 1 ? "y" : "ies"}`;
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
    <article className="rounded-[1.45rem] border border-charcoal/10 bg-white/88 p-4 shadow-soft">
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

function DayCapacityTooltip({ day }: Readonly<{ day: CalendarDay }>) {
  return (
    <div className="pointer-events-none absolute left-2 right-2 top-10 z-20 hidden rounded-2xl border border-charcoal/10 bg-white/96 p-3 text-left text-xs leading-5 text-charcoal shadow-soft group-hover:block group-focus:block">
      <div className="font-semibold">{getLoadStateLabel(day.capacity.loadState)}</div>
      <div>{day.capacity.orderPoints} capacity points ({day.capacity.duePoints} due, {day.capacity.prepPoints} prep)</div>
      <div>{day.capacity.orderCount} confirmed orders due</div>
      <div>{day.capacity.inquiryCount} active inquiries</div>
      {day.capacity.contributingOrders && day.capacity.contributingOrders.length > 0 && (
        <div className="mt-2 pt-2 border-t border-charcoal/10">
          <div className="font-semibold text-[10px] uppercase tracking-wider text-charcoal/60 mb-1">Load Contributors</div>
          {day.capacity.contributingOrders.map((order, i) => (
            <div key={`${order.id}-${order.type}-${i}`} className="flex justify-between items-center text-[11px]">
              <span>{order.reference ?? `ORD-${order.id.slice(0, 8).toUpperCase()}`}</span>
              <span className="text-charcoal/70">{order.points}pt {order.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



function WeekFocusSection({
  agendaCount,
  days,
  weeklyCapacityCeiling,
}: Readonly<{
  agendaCount: number;
  days: CalendarDay[];
  weeklyCapacityCeiling: number;
}>) {
  return (
    <AdminSectionCard
      title={`Week focus · ${formatWeekRangeLabel(days)}`}
      description={`A tighter seven-day slice from the month above. ${agendaCount} scheduled item${agendaCount === 1 ? "" : "s"} land in this week.`}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {days.map((day) => (
          <article
            key={`week-${day.dateKey}`}
            aria-label={getDayCapacityLabel(day)}
            className={cn(
              "group relative rounded-[1.35rem] border p-4 outline-none transition focus-visible:ring-2 focus-visible:ring-gold/35",
              day.isCurrentMonth
                ? day.items.some((item) => item.kind === "blackout")
                  ? "border-charcoal/18 bg-charcoal/[0.04]"
                  : getLoadCellClasses(day.capacity.loadState)
                : "border-charcoal/8 bg-paper/55 text-charcoal/52",
              day.isToday ? "ring-2 ring-gold/30" : "",
            )}
            tabIndex={0}
            title={getDayCapacityLabel(day)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/42">
                  {formatWeekdayLabel(day.dateKey)}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-charcoal">{day.dayOfMonth}</h3>
              </div>
              <span className="rounded-full border border-charcoal/8 bg-white/80 px-3 py-1 text-[11px] text-charcoal/62">
                {formatShortDateLabel(day.dateKey)}
              </span>
            </div>

            {!day.items.some((item) => item.kind === "blackout") && day.capacity.loadState !== "none" ? (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-charcoal/8">
                <div
                  className={cn("h-full rounded-full", getLoadBarClasses(day.capacity.loadState))}
                  style={{ width: `${getCapacityPercent(day.capacity.orderPoints, weeklyCapacityCeiling)}%` }}
                />
              </div>
            ) : null}

            <div className="mt-3 space-y-2">
              {day.items.length > 0 ? (
                day.items.slice(0, 3).map((item) => (
                  <div
                    key={`week-item-${day.dateKey}-${item.id}`}
                    className={`rounded-2xl border px-3 py-2 text-xs leading-5 ${getItemClasses(item)}`}
                  >
                    <div className="font-medium">{item.title}</div>
                    <div className="text-[11px] text-current/80">
                      {item.timeLabel ? `${item.timeLabel} • ` : ""}
                      {item.subtitle}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-charcoal/52">No scheduled items.</p>
              )}

              {day.items.length > 3 ? (
                <p className="text-xs text-charcoal/55">+{day.items.length - 3} more items</p>
              ) : null}
            </div>

            <DayCapacityTooltip day={day} />
          </article>
        ))}
      </div>
    </AdminSectionCard>
  );
}

function CapacitySettingsForm({
  data,
  redirectTo,
}: Readonly<{
  data: CalendarPageData;
  redirectTo: string;
}>) {
  return (
    <form
      action={updateWeeklyCapacityCeiling}
      className="flex flex-col gap-3 rounded-[1.25rem] border border-charcoal/8 bg-white/76 p-3 sm:flex-row sm:items-end"
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div className="min-w-0 flex-1">
        <Label htmlFor="weekly-capacity-ceiling">Weekly capacity ceiling</Label>
        <p className="mt-1 text-xs leading-5 text-charcoal/56">Calendar load is scored in owner-tuned points.</p>
      </div>
      <div className="w-full sm:w-36">
        <Input
          id="weekly-capacity-ceiling"
          name="weeklyCapacityCeiling"
          type="number"
          min="1"
          max="100"
          defaultValue={data.weeklyCapacityCeiling}
          required
        />
      </div>
      <Button type="submit" variant="secondary">
        Save capacity
      </Button>
    </form>
  );
}

function BlackoutForm({
  defaultDate,
  redirectTo,
}: Readonly<{
  defaultDate: string;
  redirectTo: string;
}>) {
  return (
    <form action={createBlackoutDate} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

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

      <div className="flex justify-end">
        <Button type="submit">Save blackout</Button>
      </div>
    </form>
  );
}

function CalendarEntryForm({
  defaultDate,
  redirectTo,
}: Readonly<{
  defaultDate: string;
  redirectTo: string;
}>) {
  return (
    <form action={createCalendarEntry} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

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

      <div className="flex justify-end">
        <Button type="submit">Save all-day note</Button>
      </div>
    </form>
  );
}

export default async function AdminCalendarPage({ searchParams }: AdminCalendarPageProps) {
  const rawSearchParams = await searchParams;
  const filters = parseCalendarFilters(rawSearchParams);
  const view = getCalendarView(rawSearchParams);
  const [notice, data] = await Promise.all([
    Promise.resolve(getNoticeValue(rawSearchParams)),
    getCalendarPageData(filters),
  ]);
  const defaultDate = new Date().toISOString().slice(0, 10);
  const redirectTo = buildCalendarHref(filters.month, view);
  const weekDays = getActiveWeekDays(data.days);
  const weekDateKeys = new Set(weekDays.map((day) => day.dateKey));
  const weekAgenda = data.agenda.filter((item) => weekDateKeys.has(item.dateKey));
  const noteAgenda = data.agenda.filter((item) => item.kind === "entry");

  return (
    <div className="space-y-4">
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

      <AdminPageHeader
        className="!rounded-[1.65rem] !p-4 sm:!p-5"
        eyebrow="Operational view"
        hideTitleOnMobile
        title="Calendar"
        actions={
          <>
            <div className="inline-flex items-center rounded-full border border-charcoal/10 bg-white/86 p-1 shadow-soft">
              <Link
                href={buildCalendarHref(data.previousMonthKey, view)}
                aria-label="View previous month"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-charcoal/72 transition hover:bg-paper hover:text-charcoal"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <span className="min-w-[8.75rem] px-2 text-center text-sm font-medium text-charcoal">
                {data.monthLabel}
              </span>
              <Link
                href={buildCalendarHref(data.nextMonthKey, view)}
                aria-label="View next month"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-charcoal/72 transition hover:bg-paper hover:text-charcoal"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <FilterSheet
              title="Add blackout"
              description="Block a day or date range without expanding the page chrome."
              triggerLabel="Add blackout"
              triggerIcon={<Plus className="h-4 w-4" />}
            >
              <BlackoutForm defaultDate={defaultDate} redirectTo={redirectTo} />
            </FilterSheet>

            <FilterSheet
              title="Add all-day note"
              description="Keep deadlines, tastings, and internal reminders in the calendar without pushing the grid lower."
              triggerLabel="Add note"
              triggerIcon={<Plus className="h-4 w-4" />}
            >
              <CalendarEntryForm defaultDate={defaultDate} redirectTo={redirectTo} />
            </FilterSheet>
          </>
        }
      >
        <StatusChipRow
          ariaLabel="Calendar views"
          items={[
            {
              href: buildCalendarHref(filters.month, "month"),
              isActive: view === "month",
              label: "Month",
            },
            {
              count: weekAgenda.length,
              href: buildCalendarHref(filters.month, "week"),
              isActive: view === "week",
              label: "Week",
            },
            {
              count: data.blackoutWindows.length,
              href: buildCalendarHref(filters.month, "blackouts"),
              isActive: view === "blackouts",
              label: "Blackouts",
            },
            {
              count: noteAgenda.length,
              href: buildCalendarHref(filters.month, "notes"),
              isActive: view === "notes",
              label: "Notes",
            },
          ]}
        />

        {view !== "month" ? (
          <ActiveFilterPills
            items={[
              {
                clearHref: buildCalendarHref(filters.month, "month"),
                label: "View",
                value: calendarViewLabels[view],
              },
            ]}
          />
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="w-full lg:max-w-2xl">
            <details className="group rounded-[1.25rem] border border-charcoal/8 bg-white/60 p-3 transition-all [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/60 outline-none select-none">
                <span>View Calendar Legend</span>
                <span className="text-[10px] lowercase text-charcoal/40 group-open:hidden">(click to expand)</span>
                <span className="hidden text-[10px] lowercase text-charcoal/40 group-open:inline">(click to collapse)</span>
              </summary>
              <div className="mt-3 grid gap-4 border-t border-charcoal/6 pt-3 text-xs leading-5 text-charcoal/74 sm:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-charcoal mb-1.5 uppercase tracking-wider text-[10px] text-charcoal/50">Capacity Heat Scale</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-5 rounded border border-emerald-200 bg-emerald-50/75" />
                      <span>Light Load (≤ 25%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-5 rounded border border-gold/35 bg-gold/16" />
                      <span>Moderate Load (26% - 50%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-5 rounded border border-rose/30 bg-rose/12" />
                      <span>Full Load (51% - 100%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-5 rounded border border-rose/55 bg-rose/20" />
                      <span>Overbooked (&gt; 100%)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-charcoal mb-1.5 uppercase tracking-wider text-[10px] text-charcoal/50">Day Item Markers (Dots)</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Confirmed Order / Approved Inquiry</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-gold" />
                      <span>Quoted Order / New Inquiry</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-rose" />
                      <span>In-Production / Quoted / Holiday</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-charcoal/60" />
                      <span>Manual Note / Other status</span>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 border-t border-charcoal/6 pt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="font-semibold text-charcoal mb-1.5 uppercase tracking-wider text-[10px] text-charcoal/50">Capacity &amp; Prep Shadow</h4>
                    <div className="space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="inline-block h-4 w-6 rounded border border-emerald-200 bg-emerald-50/75 flex-shrink-0" />
                        <span><strong>Prep-only Load:</strong> Heat tint from orders due on later dates, rendered without dot markers.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="inline-block h-4 w-6 rounded border border-charcoal/18 bg-charcoal/[0.04] flex-shrink-0" />
                        <span><strong>Blackout Day:</strong> Diagonal pattern; still carries prep load normally if overlapping.</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-charcoal mb-1.5 uppercase tracking-wider text-[10px] text-charcoal/50">Corner Labels</h4>
                    <div className="space-y-1 text-[11px] leading-relaxed">
                      <div><strong>Superscript (mobile) / right text (desktop):</strong></div>
                      <div className="pl-1 text-charcoal/80">• <em>X pts / X:</em> Total capacity load (due + prep points) from confirmed orders.</div>
                      <div className="pl-1 text-charcoal/80">• <em>X items / X:</em> Scheduled items count (only if 0 order points).</div>
                    </div>
                  </div>
                </div>
              </div>
            </details>
          </div>

          <div className="flex flex-wrap gap-2 lg:mt-1">
            {data.summary.map((item) => (
              <span
                key={item.label}
                className="rounded-full border border-charcoal/8 bg-white/84 px-3 py-1 text-xs text-charcoal/64"
              >
                <span className="font-semibold text-charcoal">{item.value}</span> {item.label}
              </span>
            ))}
          </div>
        </div>

        <CapacitySettingsForm data={data} redirectTo={redirectTo} />
      </AdminPageHeader>

      <section className="rounded-[1.7rem] border border-charcoal/10 bg-white/88 p-3 shadow-soft sm:p-4">
        <InteractiveCalendar
          days={data.days}
          weeklyCapacityCeiling={data.weeklyCapacityCeiling}
          weeks={data.weeks}
          redirectTo={redirectTo}
        />
      </section>

      {view === "week" ? (
        <WeekFocusSection
          agendaCount={weekAgenda.length}
          days={weekDays}
          weeklyCapacityCeiling={data.weeklyCapacityCeiling}
        />
      ) : null}

      {view === "blackouts" ? (
        <AdminSectionCard
          title="Blocked dates"
          description="Availability holds live here instead of taking over the top of the page."
        >
          <div className="space-y-4">
            {data.blackoutWindows.length > 0 ? (
              data.blackoutWindows.map((blackout) => (
                <article
                  key={blackout.id}
                  className="rounded-[1.45rem] border border-charcoal/10 bg-paper p-4"
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
                      <input type="hidden" name="redirectTo" value={redirectTo} />
                      <Button type="submit" variant="secondary" size="sm">
                        {blackout.isActive ? "Pause block" : "Reactivate"}
                      </Button>
                    </form>
                  </div>
                </article>
              ))
            ) : (
              <CompactEmptyState
                align="left"
                title="No blackout dates in this window"
                description="Add a vacation block, sold-out weekend, or private closure from the header action when you need it."
              />
            )}
          </div>
        </AdminSectionCard>
      ) : null}

      {view === "notes" ? (
        <AdminSectionCard
          title="All-day notes"
          description="Manual reminders, tastings, deadlines, and private internal entries for this month."
        >
          <div className="space-y-4">
            {noteAgenda.length > 0 ? (
              noteAgenda.map((item) => <AgendaRow key={`${item.kind}-${item.id}-${item.dateKey}`} item={item} />)
            ) : (
              <CompactEmptyState
                align="left"
                title="No manual notes in this month"
                description="Add a note from the header to keep deadlines, tastings, and other operational reminders attached to the calendar."
              />
            )}
          </div>
        </AdminSectionCard>
      ) : null}

      {view === "month" || view === "week" ? (
        <AdminSectionCard
          title={view === "week" ? "Upcoming this week" : "Upcoming agenda"}
          description={
            view === "week"
              ? "A tighter operational list for the active week slice."
              : "Upcoming order dates, inquiry pressure, blackout windows, and manual notes in one ordered list."
          }
        >
          <div className="space-y-4">
            {(view === "week" ? weekAgenda : data.agenda).length > 0 ? (
              (view === "week" ? weekAgenda : data.agenda).map((item) => (
                <AgendaRow key={`${item.kind}-${item.id}-${item.dateKey}`} item={item} />
              ))
            ) : (
              <CompactEmptyState
                align="left"
                title={view === "week" ? "Nothing scheduled for this week" : "Nothing scheduled in this month"}
                description={
                  view === "week"
                    ? "The seven-day window is clear right now."
                    : "No orders, inquiries, blackout windows, or manual notes overlap the current month window."
                }
              />
            )}
          </div>
        </AdminSectionCard>
      ) : null}
    </div>
  );
}
