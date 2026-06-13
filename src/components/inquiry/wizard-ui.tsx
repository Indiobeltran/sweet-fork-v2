import type { ComponentProps, ReactNode } from "react";
import { Check } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Small presentational building blocks for the Start Order inquiry wizard.
 *
 * These are stateless primitives (step markers, inline errors, labels, choice
 * buttons, summary rows) with clean props. They carry no business logic, so the
 * wizard component can compose them without re-declaring layout each step.
 */

export function StepMarker({
  active,
  canSelect,
  complete,
  index,
  markerRef,
  onSelect,
  description,
  title,
}: {
  active: boolean;
  canSelect: boolean;
  complete: boolean;
  index: number;
  markerRef?: (element: HTMLDivElement | null) => void;
  onSelect: () => void;
  description: string;
  title: string;
}) {
  return (
    <div
      ref={markerRef}
      role="listitem"
      className="min-w-0 lg:flex-1"
    >
      <button
        type="button"
        aria-current={active ? "step" : undefined}
        aria-label={`Step ${index + 1}: ${title}. ${description}${complete ? " Complete." : active ? " Current step." : ""}`}
        disabled={!canSelect}
        className={cn(
          "flex min-h-11 w-full min-w-0 items-center justify-center rounded-full text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50 disabled:cursor-default lg:justify-start lg:gap-2.5",
          active
            ? "bg-charcoal p-1 text-ivory shadow-soft lg:border lg:border-charcoal lg:px-3 lg:py-2"
            : "px-0 py-0",
          !active && canSelect && "hover:opacity-100",
          !canSelect && !active && "opacity-85",
        )}
        onClick={onSelect}
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition lg:h-9 lg:w-9",
            complete
              ? "border-charcoal bg-charcoal text-ivory"
              : active
                ? "border-ivory/30 bg-ivory text-charcoal"
                : "border-charcoal/10 bg-white text-charcoal/40",
          )}
        >
          {complete ? <Check className="h-4 w-4" /> : index + 1}
        </div>
        <div className="hidden min-w-0 lg:block">
          <p
            className={cn(
              "text-[10px] uppercase tracking-[0.18em]",
              active ? "text-ivory/62" : "text-charcoal/40",
            )}
          >
            Step {index + 1}
          </p>
          <p
            className={cn(
              "truncate text-sm font-medium",
              active ? "text-ivory" : complete ? "text-charcoal/68" : "text-charcoal/52",
            )}
          >
            {title}
          </p>
        </div>
      </button>
    </div>
  );
}

export function InlineError({ id, message }: { id?: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} role="alert" className="mt-2 text-sm text-rose-700">
      {message}
    </p>
  );
}

export function StepAlert({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
    >
      {message}
    </div>
  );
}

export function FieldLabel({
  children,
  required = false,
  ...props
}: ComponentProps<typeof Label> & { required?: boolean }) {
  return (
    <Label {...props}>
      <span>{children}</span>
      {required ? (
        <>
          <span className="ml-1 text-rose-700" aria-hidden="true">
            *
          </span>
          <span className="sr-only"> required</span>
        </>
      ) : null}
    </Label>
  );
}

export function SelectionButton({
  active,
  children,
  onClick,
  className,
  buttonRef,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  className?: string;
  buttonRef?: (element: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      type="button"
      ref={buttonRef}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50",
        active
          ? "border-charcoal bg-charcoal text-ivory"
          : "border-charcoal/12 bg-white text-charcoal hover:border-charcoal/30",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function StatRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-charcoal/8 py-3 last:border-none last:pb-0">
      <p className="text-sm text-charcoal/55">{label}</p>
      <div className="text-right text-sm font-medium text-charcoal">{value}</div>
    </div>
  );
}
