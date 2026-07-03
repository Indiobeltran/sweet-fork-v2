"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Lock,
  MapPin,
  Calendar,
  Layers,
  Inbox,
  Ban,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import {
  createBlackoutDate,
  createCalendarEntry,
  deleteBlackoutDate,
  getCalendarDayDetails,
  updateWeeklyCapacityCeiling,
  updateProductCapacitySettings,
} from "@/app/admin/(protected)/calendar/actions";
import { cn, toTitleCase } from "@/lib/utils";
import type { CalendarDay, CalendarDayItem } from "@/lib/admin/calendar";
import {
  getCapacityEstimateSentence,
  type CapacityLoadState,
  type CapacityWeekLoad,
} from "@/lib/admin/capacity";
import type { Tables } from "@/types/supabase.generated";

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
  "default",
] as const;

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

function getDayCapacityLabel(day: CalendarDay) {
  return `${day.dateKey}: ${day.capacity.orderPoints} points (${day.capacity.duePoints} due, ${day.capacity.prepPoints} prep), ${day.capacity.orderCount} confirmed order${day.capacity.orderCount === 1 ? "" : "s"} due, ${day.capacity.inquiryCount} active inquir${day.capacity.inquiryCount === 1 ? "y" : "ies"}`;
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

function WeekCapacityBar({
  ceiling,
  week,
}: Readonly<{
  ceiling: number;
  week: CapacityWeekLoad | null;
}>) {
  const points = week?.orderPoints ?? 0;
  const state = week?.loadState ?? "none";
  const percent = getCapacityPercent(points, ceiling);

  return (
    <div
      className={cn(
        "rounded-[1rem] border px-3 py-2",
        state === "overbooked"
          ? "border-rose/35 bg-rose/10"
          : state === "full"
            ? "border-gold/28 bg-gold/10"
            : "border-charcoal/8 bg-white/76",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/52">
          Week load
        </span>
        <span className="text-xs font-medium text-charcoal">
          {points} / {ceiling} pts
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-charcoal/8">
        <div
          className={cn("h-full rounded-full", getLoadBarClasses(state))}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function chunkCalendarWeeks(days: CalendarDay[]) {
  const weeks: CalendarDay[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

function getWeekByStartKey(weeks: CapacityWeekLoad[]) {
  return new Map(weeks.map((week) => [week.weekStartKey, week]));
}

// Inline Forms for Quick Actions
function BlackoutForm({
  defaultDate,
  redirectTo,
  onCancel,
}: Readonly<{
  defaultDate: string;
  redirectTo: string;
  onCancel: () => void;
}>) {
  return (
    <form action={createBlackoutDate} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="drawer-blackout-starts-on">Starts on</Label>
          <Input id="drawer-blackout-starts-on" name="startsOn" type="date" defaultValue={defaultDate} required />
        </div>
        <div>
          <Label htmlFor="drawer-blackout-ends-on">Ends on</Label>
          <Input id="drawer-blackout-ends-on" name="endsOn" type="date" defaultValue={defaultDate} required />
        </div>
      </div>

      <div>
        <Label htmlFor="drawer-blackout-scope">Scope</Label>
        <Select id="drawer-blackout-scope" name="scope" defaultValue="all">
          <option value="all">All bookings</option>
          <option value="pickup">Pickup only</option>
          <option value="delivery">Delivery only</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="drawer-blackout-reason">Reason</Label>
        <Input id="drawer-blackout-reason" name="reason" placeholder="Sold out weekend" required />
      </div>

      <div>
        <Label htmlFor="drawer-blackout-notes">Internal notes</Label>
        <Textarea id="drawer-blackout-notes" name="notes" placeholder="Optional context for the bakery team" />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save blackout</Button>
      </div>
    </form>
  );
}

function CalendarEntryForm({
  defaultDate,
  redirectTo,
  onCancel,
}: Readonly<{
  defaultDate: string;
  redirectTo: string;
  onCancel: () => void;
}>) {
  return (
    <form action={createCalendarEntry} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div>
        <Label htmlFor="drawer-calendar-title">Title</Label>
        <Input id="drawer-calendar-title" name="title" placeholder="Wedding tasting" required />
      </div>

      <div>
        <Label htmlFor="drawer-calendar-entry-type">Type</Label>
        <Select id="drawer-calendar-entry-type" name="entryType" defaultValue="task">
          {calendarEntryTypeOptions.map((option) => (
            <option key={option} value={option}>
              {toTitleCase(option === "default" ? "note" : option)}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="drawer-calendar-starts-on">Starts on</Label>
          <Input id="drawer-calendar-starts-on" name="startsOn" type="date" defaultValue={defaultDate} required />
        </div>
        <div>
          <Label htmlFor="drawer-calendar-ends-on">Ends on</Label>
          <Input id="drawer-calendar-ends-on" name="endsOn" type="date" defaultValue={defaultDate} />
        </div>
      </div>

      <div>
        <Label htmlFor="drawer-calendar-location">Location</Label>
        <Input id="drawer-calendar-location" name="locationText" placeholder="Bakery kitchen or venue name" />
      </div>

      <div>
        <Label htmlFor="drawer-calendar-notes">Notes</Label>
        <Textarea id="drawer-calendar-notes" name="notes" placeholder="Optional prep or timing context" />
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-charcoal/10 bg-ivory/55 px-4 py-3 text-sm text-charcoal/74">
        <input
          type="checkbox"
          name="isPrivate"
          className="h-4 w-4 rounded border-charcoal/20 text-charcoal focus:ring-gold/20"
        />
        <span>Keep this internal/private</span>
      </label>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save note</Button>
      </div>
    </form>
  );
}

type InteractiveCalendarProps = {
  days: CalendarDay[];
  weeklyCapacityCeiling: number;
  weeks: CapacityWeekLoad[];
  redirectTo: string;
  products: Tables<"products">[];
};

function ProductCapacityRow({
  product,
  redirectTo,
  onSaveSuccess,
}: {
  product: Tables<"products">;
  redirectTo: string;
  onSaveSuccess: () => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const formData = new FormData(event.currentTarget);
      const res = await updateProductCapacitySettings(formData);
      if (res.success) {
        setStatus("success");
        onSaveSuccess();
        router.refresh();
        // Clear success status after 3 seconds
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setErrorMessage(res.error ?? "Failed to save settings.");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMessage("An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center border-b border-charcoal/6 py-3 last:border-b-0 text-xs"
    >
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {/* Product Name */}
      <div className="font-semibold text-charcoal sm:col-span-1">{product.name}</div>

      {/* Capacity Points */}
      <div className="flex flex-col gap-1 sm:col-span-1">
        <Label htmlFor={`pts-${product.id}`} className="text-[10px] text-charcoal/52 sm:hidden">
          Capacity Points
        </Label>
        <Input
          id={`pts-${product.id}`}
          name="capacityPoints"
          type="number"
          step="1"
          min="1"
          max="100"
          defaultValue={product.capacity_points ?? 2}
          required
          aria-describedby={`pts-desc-${product.id}`}
          className="h-8 w-full sm:w-20 text-xs"
        />
        <span id={`pts-desc-${product.id}`} className="sr-only">
          Production effort points for {product.name}
        </span>
      </div>

      {/* Prep Days */}
      <div className="flex flex-col gap-1 sm:col-span-1">
        <Label htmlFor={`prep-${product.id}`} className="text-[10px] text-charcoal/52 sm:hidden">
          Prep Days
        </Label>
        <Input
          id={`prep-${product.id}`}
          name="prepDays"
          type="number"
          step="1"
          min="0"
          max="30"
          defaultValue={product.prep_days}
          required
          aria-describedby={`prep-desc-${product.id}`}
          className="h-8 w-full sm:w-20 text-xs"
        />
        <span id={`prep-desc-${product.id}`} className="sr-only">
          Prep shadow days before due date for {product.name}
        </span>
      </div>

      {/* Minimum Lead Time */}
      <div className="flex flex-col gap-1 sm:col-span-1">
        <Label htmlFor={`lead-${product.id}`} className="text-[10px] text-charcoal/52 sm:hidden">
          Min Lead Time (days)
        </Label>
        <Input
          id={`lead-${product.id}`}
          name="minLeadTimeDays"
          type="number"
          step="1"
          min="0"
          max="100"
          defaultValue={product.min_lead_time_days}
          required
          aria-describedby={`lead-desc-${product.id}`}
          className="h-8 w-full sm:w-20 text-xs"
        />
        <span id={`lead-desc-${product.id}`} className="sr-only">
          Minimum advance notice days for {product.name}
        </span>
      </div>

      {/* Save Button & Feedback */}
      <div className="flex flex-col gap-1 sm:col-span-1 items-stretch sm:items-end justify-center">
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={isPending}
          className="h-8 px-3 text-[11px] font-semibold w-full sm:w-auto"
        >
          {isPending ? "Saving..." : "Save changes"}
        </Button>
        <div aria-live="polite" className="text-[10px] h-3 text-center sm:text-right">
          {status === "success" && (
            <span className="text-emerald-700 font-medium">✓ Saved</span>
          )}
          {status === "error" && (
            <span className="text-rose-700 font-medium">{errorMessage}</span>
          )}
        </div>
      </div>
    </form>
  );
}

type DayDetailsState = {
  orders: Array<{
    id: string;
    eventDate: string;
    eventType: string;
    status: string;
    fulfillmentMethod: string;
    customerName: string;
    reference: string;
  }>;
  inquiries: Array<{
    id: string;
    customerName: string;
    eventDate: string;
    status: string;
    fulfillmentMethod: string;
    reference: string;
    isShortLead: boolean;
  }>;
  blackouts: Array<{
    id: string;
    starts_on: string;
    ends_on: string;
    reason: string;
    scope: string;
    notes: string | null;
    is_active: boolean;
  }>;
  notes: Array<{
    id: string;
    entry_type: string;
    title: string;
    starts_at: string;
    ends_at: string | null;
    all_day: boolean;
    notes: string | null;
    is_private: boolean;
    location_text: string | null;
  }>;
};

export function InteractiveCalendar({
  days,
  weeklyCapacityCeiling,
  weeks,
  redirectTo,
  products,
}: Readonly<InteractiveCalendarProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDateKey, setActiveDateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawerView, setDrawerView] = useState<"detail" | "add-blackout" | "add-note">("detail");
  const [dayDetails, setDayDetails] = useState<DayDetailsState | null>(null);
  const drawerDialogId = useId();

  // Ceiling Save form state
  const [ceilingPending, setCeilingPending] = useState(false);
  const [ceilingStatus, setCeilingStatus] = useState<"idle" | "success" | "error">("idle");
  const [ceilingError, setCeilingError] = useState("");
  const router = useRouter();

  const handleCeilingSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCeilingPending(true);
    setCeilingStatus("idle");
    setCeilingError("");

    try {
      const formData = new FormData(event.currentTarget);
      const res = await updateWeeklyCapacityCeiling(formData);
      if (res.success) {
        setCeilingStatus("success");
        router.refresh();
        setTimeout(() => setCeilingStatus("idle"), 3000);
      } else {
        setCeilingStatus("error");
        setCeilingError(res.error ?? "Failed to save ceiling.");
      }
    } catch (err) {
      console.error(err);
      setCeilingStatus("error");
      setCeilingError("An unexpected error occurred.");
    } finally {
      setCeilingPending(false);
    }
  };

  // Mobile gestures state
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchCurrentY, setTouchCurrentY] = useState<number | null>(null);

  const activeDay = days.find((day) => day.dateKey === activeDateKey) ?? null;
  const activeWeek = activeDay
    ? (weeks.find((w) => w.weekStartKey === activeDay.capacity.weekStartKey) ?? null)
    : null;

  // Handle ESC key for dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Fetch day details in the background when active day changes
  useEffect(() => {
    if (!activeDateKey || !isOpen) return;

    let active = true;
    setLoading(true);
    setDrawerView("detail");

    const targetDay = days.find((d) => d.dateKey === activeDateKey);
    const orderIds = targetDay?.capacity.contributingOrders.map((o) => o.id) ?? [];

    getCalendarDayDetails(activeDateKey, orderIds)
      .then((res) => {
        if (active) {
          setDayDetails(res as DayDetailsState);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load calendar day details:", err);
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeDateKey, isOpen, days]);

  const handleDayClick = (day: CalendarDay) => {
    setActiveDateKey(day.dateKey);
    setIsOpen(true);
  };

  // Arrows navigation
  const handlePrevDay = () => {
    const currentIndex = days.findIndex((d) => d.dateKey === activeDateKey);
    if (currentIndex > 0) {
      setActiveDateKey(days[currentIndex - 1].dateKey);
    }
  };

  const handleNextDay = () => {
    const currentIndex = days.findIndex((d) => d.dateKey === activeDateKey);
    if (currentIndex >= 0 && currentIndex < days.length - 1) {
      setActiveDateKey(days[currentIndex + 1].dateKey);
    }
  };

  const activeDateFormatted = activeDateKey
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(`${activeDateKey}T12:00:00.000Z`))
    : "";

  const activeDayOfWeek = activeDateKey
    ? new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(
        new Date(`${activeDateKey}T12:00:00.000Z`),
      )
    : "";

  const formatShortDateLabel = (value: string) => {
    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
    }).format(new Date(`${value}T12:00:00.000Z`));
  };

  // Mobile touch gesture handlers for swipe dismissal
  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollContainer = e.currentTarget.querySelector(".drawer-scroll-container");
    if (scrollContainer && scrollContainer.scrollTop > 0) {
      return;
    }
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const currentY = e.targetTouches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0) {
      setTouchCurrentY(currentY);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartY !== null && touchCurrentY !== null) {
      const diff = touchCurrentY - touchStartY;
      if (diff > 120) {
        setIsOpen(false);
      }
    }
    setTouchStartY(null);
    setTouchCurrentY(null);
  };

  const swipeTransform =
    touchStartY !== null && touchCurrentY !== null && touchCurrentY - touchStartY > 0
      ? { transform: `translateY(${touchCurrentY - touchStartY}px)` }
      : undefined;

  const weekByStartKey = getWeekByStartKey(weeks);
  const calendarWeeks = chunkCalendarWeeks(days);

  // Divide orders into due today vs in prep today
  const ordersDue = dayDetails?.orders.filter((o) => o.eventDate === activeDateKey) ?? [];
  const ordersPrep = dayDetails?.orders.filter((o) => o.eventDate !== activeDateKey) ?? [];

  // Find points contribution from day capacity list
  const getOrderPointsFromCapacity = (orderId: string) => {
    const contributing = activeDay?.capacity.contributingOrders.find((o) => o.id === orderId);
    return contributing?.points ?? 0;
  };

  return (
    <div className="space-y-4">
      {/* Capacity Settings Panel */}
      <details
        id="capacity-settings-panel"
        className="group rounded-[1.25rem] border border-charcoal/8 bg-white/60 p-3 transition-all [&_summary::-webkit-details-marker]:hidden"
      >
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/60 outline-none select-none">
          <span>Configure Workload Capacity</span>
          <span className="text-[10px] lowercase text-charcoal/40 group-open:hidden">(click to expand)</span>
          <span className="hidden text-[10px] lowercase text-charcoal/40 group-open:inline">(click to collapse)</span>
        </summary>
        <div className="mt-3 border-t border-charcoal/6 pt-3 space-y-6">
          {/* Weekly ceiling editor */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal/50">Weekly Ceiling Limit</h3>
            <form onSubmit={handleCeilingSave} className="flex flex-col gap-3 rounded-[1rem] border border-charcoal/8 bg-white/70 p-3 sm:flex-row sm:items-end">
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <div className="min-w-0 flex-1">
                <Label htmlFor="panel-weekly-capacity-ceiling" className="text-xs font-semibold text-charcoal">
                  Weekly Capacity Ceiling
                </Label>
                <p className="text-[11px] text-charcoal/52 leading-relaxed mt-0.5">
                  Set the point limit at which a week is considered fully booked. Load bars and colors update relative to this value.
                </p>
              </div>
              <div className="w-full sm:w-28">
                <Input
                  id="panel-weekly-capacity-ceiling"
                  name="weeklyCapacityCeiling"
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  defaultValue={weeklyCapacityCeiling}
                  required
                  className="h-9 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1 sm:items-end">
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  disabled={ceilingPending}
                  className="h-9 px-4 text-xs font-semibold w-full sm:w-auto"
                >
                  {ceilingPending ? "Saving..." : "Save ceiling"}
                </Button>
                <div aria-live="polite" className="text-[10px] h-3 text-center sm:text-right">
                  {ceilingStatus === "success" && (
                    <span className="text-emerald-700 font-medium">✓ Saved successfully</span>
                  )}
                  {ceilingStatus === "error" && (
                    <span className="text-rose-700 font-medium">{ceilingError}</span>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Product capacity section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal/50">Product Capacity Weights</h3>
            
            {/* Table Header (Desktop only) */}
            <div className="hidden sm:grid grid-cols-5 gap-3 border-b border-charcoal/10 pb-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-charcoal/40">
              <div>Product</div>
              <div>Capacity Points (effort)</div>
              <div>Prep Days</div>
              <div>Min Lead Time (days)</div>
              <div className="text-right">Actions</div>
            </div>

            {/* Active Products */}
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded w-max mb-2">
                Active Products
              </h4>
              {products.filter((p) => p.is_active).map((product) => (
                <ProductCapacityRow
                  key={product.id}
                  product={product}
                  redirectTo={redirectTo}
                  onSaveSuccess={() => {}}
                />
              ))}
            </div>

            {/* Inactive Products */}
            {products.some((p) => !p.is_active) && (
              <div className="space-y-1 pt-4 border-t border-dashed border-charcoal/8">
                <h4 className="text-[10px] font-bold text-charcoal/52 uppercase tracking-widest bg-charcoal/5 px-2 py-0.5 rounded w-max mb-2">
                  Inactive Products
                </h4>
                {products.filter((p) => !p.is_active).map((product) => (
                  <ProductCapacityRow
                    key={product.id}
                    product={product}
                    redirectTo={redirectTo}
                    onSaveSuccess={() => {}}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Live Summary Line & Explainer */}
          <div className="rounded-[1rem] border border-charcoal/8 bg-ivory/40 p-3 space-y-2 text-xs">
            <div className="font-semibold text-charcoal/82">
              {getCapacityEstimateSentence(weeklyCapacityCeiling, products)}
            </div>
            <p className="text-[10px] text-charcoal/48 italic leading-relaxed">
              Disclaimer: This is a rough planning estimate based on saved settings. Point totals alone do not guarantee availability.
            </p>
            <p className="text-[11px] text-charcoal/54 leading-relaxed pt-1.5 border-t border-charcoal/6">
              <strong>Notice:</strong> Capacity points estimate the workload/effort of confirmed orders. Prep days shadow the workload onto preceding days. Minimum lead time flags active inquiries requiring faster notice than normal.
            </p>
          </div>
        </div>
      </details>

      {/* 1. Static Layout matching pre-refactor identically */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekdayLabels.map((label) => (
          <div
            key={`weekday-${label}`}
            className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal/42 sm:rounded-[1rem] sm:border sm:border-charcoal/8 sm:bg-white/72 sm:px-3 sm:py-2 sm:text-xs"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Mobile grid view */}
      <div className="mt-2 space-y-2 md:hidden">
        {calendarWeeks.map((weekDays) => {
          const week = weekByStartKey.get(weekDays[0]?.capacity.weekStartKey ?? "") ?? null;

          return (
            <div key={`mobile-week-${weekDays[0]?.dateKey ?? "empty"}`} className="space-y-1.5">
              <WeekCapacityBar ceiling={weeklyCapacityCeiling} week={week} />

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {weekDays.map((day) => {
                  const hasBlackout = day.items.some((item) => item.kind === "blackout");

                  return (
                    <button
                      type="button"
                      onClick={() => handleDayClick(day)}
                      key={`mobile-${day.dateKey}`}
                      aria-label={getDayCapacityLabel(day)}
                      className={cn(
                        "group relative flex aspect-[0.82] min-w-0 flex-col rounded-[0.95rem] border px-1.5 py-2 outline-none text-left transition focus-visible:ring-2 focus-visible:ring-gold/35 sm:px-2",
                        day.isCurrentMonth
                          ? hasBlackout
                            ? "border-charcoal/18 bg-charcoal/[0.04]"
                            : getLoadCellClasses(day.capacity.loadState)
                          : "border-charcoal/6 bg-paper/70 text-charcoal/45",
                        day.isToday ? "ring-2 ring-gold/30" : "",
                      )}
                      title={getDayCapacityLabel(day)}
                    >
                      <div className="flex items-start justify-between gap-1 w-full">
                        <span className="text-sm font-semibold text-current">{day.dayOfMonth}</span>
                        {day.capacity.orderPoints > 0 ? (
                          <span className="text-[10px] font-semibold text-current/70">
                            {day.capacity.orderPoints}
                          </span>
                        ) : day.items.length > 0 ? (
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

                      {!hasBlackout && day.capacity.loadState !== "none" ? (
                        <div className={cn("mt-1 h-1 rounded-full w-full", getLoadBarClasses(day.capacity.loadState))} />
                      ) : null}

                      <DayCapacityTooltip day={day} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop grid view */}
      <div className="mt-3 hidden overflow-x-auto md:block">
        <div className="min-w-[70rem]">
          <div className="space-y-4">
            {calendarWeeks.map((weekDays) => {
              const week = weekByStartKey.get(weekDays[0]?.capacity.weekStartKey ?? "") ?? null;

              return (
                <div key={`desktop-week-${weekDays[0]?.dateKey ?? "empty"}`} className="space-y-2">
                  <WeekCapacityBar ceiling={weeklyCapacityCeiling} week={week} />

                  <div className="grid grid-cols-7 gap-3">
                    {weekDays.map((day) => {
                      const hasBlackout = day.items.some((item) => item.kind === "blackout");

                      return (
                        <button
                          type="button"
                          onClick={() => handleDayClick(day)}
                          key={day.dateKey}
                          aria-label={getDayCapacityLabel(day)}
                          className={cn(
                            "group relative min-h-[11rem] rounded-[1.45rem] border p-3 shadow-soft outline-none text-left transition focus-visible:ring-2 focus-visible:ring-gold/35 w-full block",
                            day.isCurrentMonth
                              ? hasBlackout
                                ? "border-charcoal/18 bg-charcoal/[0.04]"
                                : getLoadCellClasses(day.capacity.loadState)
                              : "border-charcoal/6 bg-paper/70 text-charcoal/50",
                            day.isToday ? "ring-2 ring-gold/30" : "",
                          )}
                          title={getDayCapacityLabel(day)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm font-semibold text-charcoal/74">{day.dayOfMonth}</span>
                            <span className="text-[11px] uppercase tracking-[0.16em] text-charcoal/42">
                              {day.capacity.orderPoints > 0
                                ? `${day.capacity.orderPoints} pts`
                                : `${day.items.length} item${day.items.length === 1 ? "" : "s"}`}
                            </span>
                          </div>

                          {!hasBlackout && day.capacity.loadState !== "none" ? (
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-charcoal/8 w-full">
                              <div
                                  className={cn("h-full rounded-full", getLoadBarClasses(day.capacity.loadState))}
                                  style={{
                                    width: `${getCapacityPercent(day.capacity.orderPoints, weeklyCapacityCeiling)}%`,
                                  }}
                                />
                              </div>
                            ) : null}

                          <div className="mt-3 space-y-2 w-full">
                            {day.items.slice(0, 4).map((item) => (
                              <div
                                key={`${day.dateKey}-${item.kind}-${item.id}`}
                                className={`rounded-2xl border px-3 py-2 text-xs leading-5 w-full block ${getItemClasses(item)}`}
                              >
                                <div className="font-medium truncate">{item.title}</div>
                                <div className="text-[11px] text-current/80 truncate">
                                  {item.timeLabel ? `${item.timeLabel} • ` : ""}
                                  {item.subtitle}
                                </div>
                              </div>
                            ))}

                            {day.items.length > 4 ? (
                              <p className="text-xs text-charcoal/55">+{day.items.length - 4} more items</p>
                            ) : null}
                          </div>

                          <DayCapacityTooltip day={day} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Interactive Day Drawer */}
      {isOpen && activeDay && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close day detail panel"
            className="fixed inset-0 z-[60] bg-charcoal/20 backdrop-blur-[2px] transition-opacity duration-300 w-full h-full text-left"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Panel Container */}
          <div
            className="fixed inset-0 z-[70] flex items-end justify-center px-0 pb-0 pt-10 pointer-events-none md:items-stretch md:justify-end md:pl-10 md:pr-0 md:pt-0"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              id={drawerDialogId}
              role="dialog"
              aria-modal="true"
              aria-label={`Details for ${activeDateFormatted}`}
              style={{
                ...swipeTransform,
                transition: touchStartY !== null ? "none" : "transform 0.3s ease-out",
              }}
              className={cn(
                "flex max-h-[min(88vh,48rem)] w-full flex-col overflow-hidden rounded-t-[1.8rem] border border-charcoal/10 bg-ivory shadow-[0_-24px_72px_rgba(53,37,29,0.18)] backdrop-blur-xl transition-all duration-300 ease-out translate-y-0 pointer-events-auto",
                "md:max-h-none md:h-full md:w-[32rem] md:rounded-l-[1.8rem] md:rounded-t-none md:border-l md:border-t-0 md:translate-y-0 md:translate-x-0",
              )}
            >
              {/* Drawer Header */}
              <div className="border-b border-charcoal/8 px-4 pb-3 pt-3 sm:px-5 shrink-0">
                {/* Mobile Drag Indicator */}
                <div className="mx-auto h-1.5 w-14 rounded-full bg-charcoal/14 md:hidden mb-4" />

                <div className="flex items-start justify-between gap-4">
                  {/* Prev/Next arrows & Title */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                        {activeDayOfWeek} details
                      </p>
                      {activeDay && (
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                            activeDay.capacity.loadState === "overbooked"
                              ? "border-rose/30 bg-rose/10 text-rose-800"
                              : activeDay.capacity.loadState === "full"
                                ? "border-rose/20 bg-rose/5 text-rose-700"
                                : activeDay.capacity.loadState === "moderate"
                                  ? "border-gold/30 bg-gold/10 text-amber-800"
                                  : activeDay.capacity.loadState === "light"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : "border-charcoal/10 bg-white/60 text-charcoal/60",
                          )}
                        >
                          {getLoadStateLabel(activeDay.capacity.loadState)} — {activeDay.capacity.orderPoints} pts
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex items-center justify-between gap-2 mr-2">
                      <h2 className="font-serif text-[1.75rem] tracking-[-0.04em] text-charcoal sm:text-[2rem] truncate leading-tight">
                        {activeDateKey ? formatShortDateLabel(activeDateKey) : ""}
                      </h2>

                      {/* Nav Arrows */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-full border border-charcoal/8 bg-white/80 text-charcoal/70 p-0 flex items-center justify-center"
                          onClick={handlePrevDay}
                          disabled={days.findIndex((d) => d.dateKey === activeDateKey) === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-full border border-charcoal/8 bg-white/80 text-charcoal/70 p-0 flex items-center justify-center"
                          onClick={handleNextDay}
                          disabled={
                            days.findIndex((d) => d.dateKey === activeDateKey) === days.length - 1
                          }
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Close button */}
                  <button
                    type="button"
                    aria-label="Close panel"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-charcoal/10 bg-white/82 text-charcoal transition hover:border-charcoal/20 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
                    onClick={() => setIsOpen(false)}
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Contents */}
              <div className="drawer-scroll-container overflow-y-auto px-4 py-4 sm:px-5 flex-1 space-y-6">
                {drawerView === "detail" && (
                  <>
                    {/* Capacity Summary Card */}
                    <div className="rounded-[1.4rem] border border-charcoal/8 bg-white/70 p-4 shadow-soft">
                      <div className="flex items-center justify-between border-b border-charcoal/6 pb-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/50 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" /> Workload capacity
                        </span>
                        <span className="text-xs font-semibold text-charcoal">
                          {activeDay?.capacity.orderPoints ?? 0} pts total today
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 text-xs">
                        <div>
                          <p className="text-charcoal/50">Due today</p>
                          <p className="font-semibold text-charcoal mt-0.5 text-sm">
                            {activeDay?.capacity.duePoints ?? 0} pts
                          </p>
                        </div>
                        <div>
                          <p className="text-charcoal/50">Prep work</p>
                          <p className="font-semibold text-charcoal mt-0.5 text-sm">
                            {activeDay?.capacity.prepPoints ?? 0} pts
                          </p>
                        </div>
                      </div>

                      {activeWeek && (
                        <div className="mt-4 border-t border-charcoal/6 pt-3">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-charcoal/50">Weekly total workload</span>
                            <span className="font-medium text-charcoal">
                              {activeDay?.capacity.orderPoints ?? 0} pts of week&apos;s{" "}
                              {activeWeek.orderPoints}/{weeklyCapacityCeiling}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-charcoal/8">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                getLoadBarClasses(activeWeek.loadState),
                              )}
                              style={{
                                width: `${getCapacityPercent(activeWeek.orderPoints, weeklyCapacityCeiling)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Background Detail Loading Spinner */}
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                        <span className="text-xs text-charcoal/50">Retrieving day details...</span>
                      </div>
                    ) : (
                      <>
                        {/* Orders Section */}
                        <section className="space-y-3">
                          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/50 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" /> Orders
                          </h3>

                          {ordersDue.length === 0 && ordersPrep.length === 0 ? (
                            <p className="text-xs text-charcoal/50 bg-white/40 border border-charcoal/6 rounded-2xl p-3 text-center">
                              No orders scheduled or in prep today.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {/* Due Today */}
                              {ordersDue.map((order) => {
                                const pts = getOrderPointsFromCapacity(order.id);
                                return (
                                  <Link
                                    key={order.id}
                                    href={`/admin/orders/${order.id}`}
                                    className="block border border-charcoal/10 bg-white/80 rounded-2xl p-3 shadow-soft hover:bg-white transition hover:-translate-y-0.5"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="font-semibold text-charcoal text-sm leading-snug">
                                          {order.customerName} {order.eventType}
                                        </p>
                                        <p className="text-xs text-charcoal/50 mt-1 flex items-center gap-1">
                                          <span>
                                            {order.fulfillmentMethod === "delivery"
                                              ? "Delivery"
                                              : "Pickup"}
                                          </span>
                                          <span>•</span>
                                          <span>{order.reference}</span>
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <span
                                          className={cn(
                                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider block text-center mb-1.5",
                                            order.status === "confirmed" ||
                                              order.status === "completed"
                                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                              : order.status === "quoted"
                                                ? "border-gold/30 bg-gold/10 text-amber-800"
                                                : order.status === "in-production"
                                                  ? "border-rose/30 bg-rose/10 text-rose-800"
                                                  : "border-charcoal/10 bg-white/60 text-charcoal/60",
                                          )}
                                        >
                                          {order.status}
                                        </span>
                                        <span className="text-[11px] font-semibold text-charcoal/70 bg-charcoal/5 rounded px-1.5 py-0.5">
                                          {pts} pts due
                                        </span>
                                      </div>
                                    </div>
                                  </Link>
                                );
                              })}

                              {/* In Prep */}
                              {ordersPrep.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-charcoal/6">
                                  <h4 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-charcoal/40">
                                    In Prep (Due Later)
                                  </h4>
                                  {ordersPrep.map((order) => {
                                    const pts = getOrderPointsFromCapacity(order.id);
                                    return (
                                      <Link
                                        key={order.id}
                                        href={`/admin/orders/${order.id}`}
                                        className="block border border-charcoal/8 bg-white/50 rounded-2xl p-3 shadow-soft hover:bg-white/80 transition hover:-translate-y-0.5"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <p className="font-semibold text-charcoal text-xs leading-snug">
                                              {order.customerName} {order.eventType}
                                            </p>
                                            <p className="text-[11px] text-charcoal/50 mt-1">
                                              Due {formatShortDateLabel(order.eventDate)} •{" "}
                                              {order.reference}
                                            </p>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5">
                                              +{pts} pt prep today
                                            </span>
                                          </div>
                                        </div>
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </section>

                        {/* Inquiries Section */}
                        <section className="space-y-3">
                          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/50 flex items-center gap-1.5">
                            <Inbox className="h-3.5 w-3.5" /> Inquiries
                          </h3>

                          {dayDetails?.inquiries.length === 0 ? (
                            <p className="text-xs text-charcoal/50 bg-white/40 border border-charcoal/6 rounded-2xl p-3 text-center">
                              No inquiries requesting this date.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {dayDetails?.inquiries.map((inq) => (
                                <Link
                                  key={inq.id}
                                  href={`/admin/inquiries/${inq.id}`}
                                  className="block border border-charcoal/10 bg-white/80 rounded-2xl p-3 shadow-soft hover:bg-white transition hover:-translate-y-0.5"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-charcoal text-sm leading-snug">
                                        {inq.customerName} inquiry
                                      </p>
                                      <p className="text-xs text-charcoal/50 mt-1 flex items-center gap-1">
                                        <span>
                                          {inq.fulfillmentMethod === "delivery"
                                            ? "Delivery"
                                            : "Pickup"}
                                        </span>
                                        <span>•</span>
                                        <span>{inq.reference}</span>
                                      </p>

                                      {inq.isShortLead && (
                                        <span className="inline-block mt-2 rounded-full border border-rose/30 bg-rose/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-rose-800">
                                          Short lead
                                        </span>
                                      )}
                                    </div>

                                    <span
                                      className={cn(
                                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0 text-center",
                                        inq.status === "approved"
                                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                          : inq.status === "new"
                                            ? "border-gold/30 bg-gold/10 text-amber-800"
                                            : inq.status === "quoted"
                                              ? "border-rose/30 bg-rose/10 text-rose-800"
                                              : "border-charcoal/10 bg-white/60 text-charcoal/60",
                                      )}
                                    >
                                      {inq.status}
                                    </span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </section>

                        {/* Blackouts and Notes Section */}
                        <section className="space-y-3">
                          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/50 flex items-center gap-1.5">
                            <Ban className="h-3.5 w-3.5" /> Availability &amp; Notes
                          </h3>

                          {dayDetails?.blackouts.length === 0 && dayDetails?.notes.length === 0 ? (
                            <p className="text-xs text-charcoal/50 bg-white/40 border border-charcoal/6 rounded-2xl p-3 text-center">
                              No blackout holds or operational notes today.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {dayDetails?.blackouts.map((blackout) => (
                                <div
                                  key={blackout.id}
                                  className="border border-rose/20 bg-rose/5 rounded-2xl p-3"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-rose-950 text-sm">
                                        Blocked: {blackout.reason}
                                      </p>
                                      <p className="text-xs text-rose-900/60 mt-1">
                                        Scope: {blackout.scope} Booking Availability
                                      </p>
                                      {blackout.notes && (
                                        <p className="text-xs text-rose-950/70 mt-2 bg-white/30 rounded p-2 border border-rose/10">
                                          {blackout.notes}
                                        </p>
                                      )}
                                    </div>
                                    <span
                                      className={cn(
                                        "rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider shrink-0 text-center",
                                        blackout.is_active
                                          ? "border-rose-300 bg-rose-100 text-rose-800"
                                          : "border-charcoal/10 bg-white/60 text-charcoal/60",
                                      )}
                                    >
                                      {blackout.is_active ? "Active Hold" : "Paused"}
                                    </span>
                                  </div>
                                </div>
                              ))}

                              {dayDetails?.notes.map((note) => (
                                <div
                                  key={note.id}
                                  className="border border-charcoal/10 bg-white/70 rounded-2xl p-3"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-charcoal text-sm">
                                        {note.title}
                                      </p>
                                      <div className="flex flex-wrap gap-1.5 mt-1">
                                        <span className="text-[10px] font-semibold uppercase bg-charcoal/5 px-1.5 py-0.5 text-charcoal/60 rounded">
                                          {note.entry_type === "default" ? "note" : note.entry_type}
                                        </span>
                                        {note.location_text && (
                                          <span className="text-[10px] text-charcoal/50 flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> {note.location_text}
                                          </span>
                                        )}
                                        {note.is_private && (
                                          <span className="text-[10px] text-rose-700/80 flex items-center gap-1">
                                            <Lock className="h-3 w-3" /> private
                                          </span>
                                        )}
                                      </div>
                                      {note.notes && (
                                        <p className="text-xs text-charcoal/70 mt-2 border-t border-charcoal/5 pt-2 whitespace-pre-line leading-relaxed">
                                          {note.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                      </>
                    )}
                  </>
                )}

                {/* Inline Blackout Form View */}
                {drawerView === "add-blackout" && activeDateKey && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-charcoal/6 pb-2 mb-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDrawerView("detail")}
                        className="text-xs gap-1 font-semibold uppercase tracking-wider text-charcoal/60"
                      >
                        ← Detail
                      </Button>
                      <span className="text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                        Add Blackout Hold
                      </span>
                    </div>
                    <BlackoutForm
                      defaultDate={activeDateKey}
                      redirectTo={redirectTo}
                      onCancel={() => setDrawerView("detail")}
                    />
                  </div>
                )}

                {/* Inline Notes/Entry Form View */}
                {drawerView === "add-note" && activeDateKey && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-charcoal/6 pb-2 mb-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDrawerView("detail")}
                        className="text-xs gap-1 font-semibold uppercase tracking-wider text-charcoal/60"
                      >
                        ← Detail
                      </Button>
                      <span className="text-xs font-semibold uppercase tracking-wider text-charcoal/40">
                        Add Calendar Note
                      </span>
                    </div>
                    <CalendarEntryForm
                      defaultDate={activeDateKey}
                      redirectTo={redirectTo}
                      onCancel={() => setDrawerView("detail")}
                    />
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions (Detail View Only) */}
              {drawerView === "detail" && (
                <div className="border-t border-charcoal/8 px-4 py-4 sm:px-5 shrink-0 bg-white/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-10 gap-1.5 rounded-full px-4 text-xs font-semibold uppercase tracking-wider flex-1"
                      onClick={() => setDrawerView("add-note")}
                      disabled={loading}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add note
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-10 gap-1.5 rounded-full px-4 text-xs font-semibold uppercase tracking-wider flex-1"
                      onClick={() => setDrawerView("add-blackout")}
                      disabled={loading}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add blackout
                    </Button>

                    {/* Remove Blackout Form */}
                    {dayDetails && dayDetails.blackouts.length > 0 && (
                      <form action={deleteBlackoutDate} className="w-full mt-2">
                        <input
                          type="hidden"
                          name="blackoutId"
                          value={dayDetails.blackouts[0].id}
                        />
                        <input type="hidden" name="redirectTo" value={redirectTo} />
                        <ConfirmSubmitButton
                          confirmMessage="Remove blackout hold for this day? This returns bookings to their default rules."
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="h-10 w-full rounded-full border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 text-xs font-semibold uppercase tracking-wider"
                        >
                          Remove blackout
                        </ConfirmSubmitButton>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
