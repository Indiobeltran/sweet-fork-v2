"use client";

import { useMemo, useState } from "react";

import {
  createQuoteRevision,
  finalizeQuoteDraft,
  savePricingProfile,
  saveQuoteDraft,
} from "@/app/admin/(protected)/inquiries/[id]/quote/actions";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { QuoteBuilderData } from "@/lib/admin/quotes";
import { calculateQuote } from "@/lib/quotes/pricing-engine";
import {
  quoteStageKeys,
  type PricingProfile,
  type QuoteInput,
  type QuoteLineInput,
  type QuoteStageKey,
} from "@/lib/quotes/types";
import { formatDate, toTitleCase } from "@/lib/utils";

const complexityOptions = ["simple", "standard", "intricate"] as const;
const productionStageLabels: Array<[QuoteStageKey, string]> = [
  ["planning", "Planning hours"],
  ["shoppingPrep", "Shopping / prep hours"],
  ["baking", "Baking hours"],
  ["decorating", "Decorating hours"],
  ["packagingCleanup", "Packaging / cleanup hours"],
];
const allStageLabels: Record<QuoteStageKey, string> = {
  baking: "Baking",
  decorating: "Decorating",
  deliverySetup: "Delivery setup",
  packagingCleanup: "Packaging / cleanup",
  planning: "Planning",
  shoppingPrep: "Shopping / prep",
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function percentage(value: number | null) {
  return value === null ? "Not available" : `${(value * 100).toFixed(1)}%`;
}

function numericValue(value: string, minimum = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(parsed, minimum) : minimum;
}

function inputClassName() {
  return "tabular-nums";
}

type BuilderProps = {
  data: QuoteBuilderData;
};

export function InquiryQuoteBuilder({ data }: Readonly<BuilderProps>) {
  const savedDraft = data.currentQuote?.status === "draft" ? data.currentQuote : null;
  const savedSnapshot = savedDraft?.snapshot ?? null;
  const lockedQuote = data.currentQuote?.status === "finalized" ? data.currentQuote : null;
  const initialInput = savedSnapshot?.input ?? data.startingInput;
  const [input, setInput] = useState<QuoteInput | null>(() =>
    initialInput ? clone(initialInput) : null,
  );
  const [profile, setProfile] = useState<PricingProfile>(() => clone(data.pricingProfile));
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  const calculationState = useMemo(() => {
    if (!input) return { calculation: null, error: null };

    try {
      return { calculation: calculateQuote(profile, input), error: null };
    } catch {
      return {
        calculation: null,
        error: "Review the quote fields. One or more values cannot be calculated yet.",
      };
    }
  }, [input, profile]);

  const calculation = calculationState.calculation;
  const isProfileDirty = JSON.stringify(profile) !== JSON.stringify(data.pricingProfile);
  const profileDiffersFromSavedDraft = Boolean(
    savedSnapshot && JSON.stringify(profile) !== JSON.stringify(savedSnapshot.profile),
  );
  const hasUnsavedChanges =
    !savedSnapshot ||
    !input ||
    JSON.stringify(input) !== JSON.stringify(savedSnapshot.input) ||
    isProfileDirty ||
    profileDiffersFromSavedDraft;

  function updateLine(index: number, updater: (line: QuoteLineInput) => QuoteLineInput) {
    setInput((current) => {
      if (!current) return current;
      return {
        ...current,
        lines: current.lines.map((line, lineIndex) =>
          lineIndex === index ? updater(line) : line,
        ),
      };
    });
  }

  function manualPricingFor(line: QuoteLineInput) {
    const calculatedLine = calculation?.lines.find((candidate) => candidate.id === line.id);
    const quantity = line.quantity ?? 1;

    return {
      materialAllowance: calculatedLine ? calculatedLine.materialAllowance / quantity : 0,
      packagingAllowance: calculatedLine ? calculatedLine.packagingAllowance / quantity : 0,
      source: "manual" as const,
      stageHours: Object.fromEntries(
        quoteStageKeys.map((stage) => [
          stage,
          calculatedLine ? calculatedLine.stageHours[stage] / quantity : 0,
        ]),
      ),
    };
  }

  function updateManualLineNumber(
    index: number,
    key: "materialAllowance" | "packagingAllowance",
    value: number,
  ) {
    updateLine(index, (line) => ({
      ...line,
      pricing: { ...manualPricingFor(line), [key]: value, source: "manual" },
    }));
  }

  function updateManualStage(index: number, stage: QuoteStageKey, value: number) {
    updateLine(index, (line) => {
      const manual = manualPricingFor(line);
      return {
        ...line,
        pricing: {
          ...manual,
          source: "manual",
          stageHours: { ...manual.stageHours, [stage]: value },
        },
      };
    });
  }

  function setFixedAdjustment(
    key: "rush" | "contingency" | "discount",
    value: number,
  ) {
    setInput((current) =>
      current ? { ...current, [key]: { kind: "fixed", value } } : current,
    );
  }

  function updateProfileNumber(
    key:
      | "ownerHourlyRate"
      | "fixedOverheadPerOrder"
      | "variableOverheadRate"
      | "targetMargin"
      | "minimumMargin"
      | "defaultTaxRate"
      | "defaultDepositRate"
      | "defaultQuoteValidityDays",
    value: number,
  ) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function updateProductPreset(
    productKey: string,
    complexityKey: string,
    field: "materialAllowance" | "packagingAllowance" | QuoteStageKey,
    value: number,
  ) {
    setProfile((current) => {
      const product = current.productPresets[productKey];
      const preset = product.complexities[complexityKey];
      const isStage = quoteStageKeys.includes(field as QuoteStageKey);
      const updatedPreset = isStage
        ? { ...preset, stageHours: { ...preset.stageHours, [field]: value } }
        : { ...preset, [field]: value };

      return {
        ...current,
        productPresets: {
          ...current.productPresets,
          [productKey]: {
            ...product,
            complexities: {
              ...product.complexities,
              [complexityKey]: updatedPreset,
            },
          },
        },
      };
    });
  }

  function updatePublicStartingPrice(productKey: string, value: number) {
    setProfile((current) => ({
      ...current,
      productPresets: {
        ...current.productPresets,
        [productKey]: {
          ...current.productPresets[productKey],
          publicStartingPrice: value,
        },
      },
    }));
  }

  if (lockedQuote) {
    const lockedCalculation = lockedQuote.snapshot?.calculation;
    const customerMessage = lockedQuote.customer_message ?? "Customer message unavailable.";

    return (
      <div className="space-y-4">
        <AdminSectionCard
          title={`Finalized quote · Version ${lockedQuote.version}`}
          description="This version is locked. Create a revision to make changes without altering the finalized history."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Final pre-tax price"
              value={lockedCalculation ? money(lockedCalculation.pricing.finalPrice) : "Unavailable"}
            />
            <Metric label="Customer total" value={money(lockedCalculation?.pricing.customerTotal ?? lockedQuote.final_price)} />
            <Metric label="Deposit due" value={money(lockedQuote.deposit_amount)} />
            <Metric label="Balance due" value={money(lockedCalculation?.pricing.balanceDue ?? Math.max(lockedQuote.final_price - lockedQuote.deposit_amount, 0))} />
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-charcoal/10 bg-ivory/65 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/48">
                  Copy-ready customer message
                </p>
                <p className="mt-1 text-sm text-charcoal/62">Internal costs and margins are excluded.</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(customerMessage);
                    setCopyStatus("copied");
                  } catch {
                    setCopyStatus("failed");
                  }
                }}
              >
                Copy customer message
              </Button>
            </div>
            <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-charcoal/75">
              {customerMessage}
            </pre>
            <p className="mt-2 text-sm font-medium text-charcoal/72" aria-live="polite">
              {copyStatus === "copied"
                ? "Customer message copied."
                : copyStatus === "failed"
                  ? "Could not copy automatically. Select the message above and copy it manually."
                  : ""}
            </p>
          </div>

          <form action={createQuoteRevision} className="mt-5">
            <input type="hidden" name="inquiryId" value={data.inquiry.id} />
            <Button type="submit">Create revision</Button>
          </form>
        </AdminSectionCard>

        <QuoteHistory data={data} />
        <PricingCalibration profile={profile} data={data} onProfileChange={setProfile} onPresetChange={updateProductPreset} onPublicStartingPriceChange={updatePublicStartingPrice} onNumberChange={updateProfileNumber} />
      </div>
    );
  }

  if (!input) {
    return (
      <AdminSectionCard
        title="Quote builder unavailable"
        description="Add at least one requested item to the inquiry before building a quote."
      >
        <QuoteHistory data={data} />
      </AdminSectionCard>
    );
  }

  const totalHours = calculation
    ? calculation.lines.reduce((sum, line) => sum + line.totalHours, 0) +
      (calculation.delivery?.setupHours ?? 0)
    : 0;
  const nonLaborCosts = calculation
    ? calculation.costs.internalTotal - calculation.costs.labor
    : 0;
  const effectiveLaborRecovery =
    calculation && totalHours > 0
      ? (calculation.pricing.finalPrice - nonLaborCosts) / totalHours
      : null;

  return (
    <div className="space-y-4">
      <AdminSectionCard
        title={savedDraft ? `Draft quote · Version ${savedDraft.version}` : "Build quote"}
        description="Adjust the internal assumptions below, review the live totals, then save the draft before finalizing it."
      >
        <div className="space-y-5">
          {input.lines.map((line, index) => {
            const item = data.inquiry.items.find((candidate) => candidate.id === line.id);
            const calculatedLine = calculation?.lines.find((candidate) => candidate.id === line.id);
            const quantity = line.quantity ?? 1;
            const materialAllowance = calculatedLine
              ? calculatedLine.materialAllowance / quantity
              : line.pricing?.materialAllowance ?? 0;
            const packagingAllowance = calculatedLine
              ? calculatedLine.packagingAllowance / quantity
              : line.pricing?.packagingAllowance ?? 0;
            const special = line.specialCosts?.[0];

            return (
              <fieldset key={line.id} className="rounded-[1.7rem] border border-charcoal/10 bg-paper/75 p-4 sm:p-5">
                <legend className="px-2 font-serif text-2xl tracking-[-0.03em] text-charcoal">
                  {item?.product_label ?? profile.productPresets[line.productKey]?.label ?? toTitleCase(line.productKey)}
                </legend>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-charcoal/60">
                    Pricing source: <span className="font-medium text-charcoal">{calculatedLine?.pricingSource ?? "pending"}</span>
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => updateLine(index, (current) => ({
                      ...current,
                      pricing: { source: "preset" },
                    }))}
                  >
                    Use preset
                  </Button>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <Field label="Complexity" htmlFor={`line-${line.id}-complexity`}>
                    <Select
                      id={`line-${line.id}-complexity`}
                      value={line.complexityKey}
                      onChange={(event) => updateLine(index, (current) => ({
                        ...current,
                        complexityKey: event.target.value,
                        pricing: { source: "preset" },
                      }))}
                    >
                      {complexityOptions.map((complexity) => (
                        <option key={complexity} value={complexity}>{toTitleCase(complexity)}</option>
                      ))}
                    </Select>
                  </Field>
                  <NumberField
                    id={`line-${line.id}-quantity`}
                    label="Quantity"
                    min={1}
                    step="1"
                    value={quantity}
                    onChange={(value) => updateLine(index, (current) => ({
                      ...current,
                      quantity: Math.max(Math.round(value), 1),
                    }))}
                  />
                  <NumberField
                    id={`line-${line.id}-materials`}
                    label="Material allowance"
                    prefix="$"
                    value={materialAllowance}
                    onChange={(value) => updateManualLineNumber(index, "materialAllowance", value)}
                  />
                  <NumberField
                    id={`line-${line.id}-packaging`}
                    label="Packaging allowance"
                    prefix="$"
                    value={packagingAllowance}
                    onChange={(value) => updateManualLineNumber(index, "packagingAllowance", value)}
                  />
                  {productionStageLabels.map(([stage, label]) => (
                    <NumberField
                      key={stage}
                      id={`line-${line.id}-${stage}`}
                      label={label}
                      step="0.25"
                      value={calculatedLine ? calculatedLine.stageHours[stage] / quantity : line.pricing?.stageHours?.[stage] ?? 0}
                      onChange={(value) => updateManualStage(index, stage, value)}
                    />
                  ))}
                </div>

                <div className="mt-5 grid gap-4 rounded-[1.4rem] border border-charcoal/8 bg-white/80 p-4 sm:grid-cols-2">
                  <Field label="Special add-on label" htmlFor={`line-${line.id}-special-label`}>
                    <Input
                      id={`line-${line.id}-special-label`}
                      value={special?.label ?? ""}
                      placeholder="Optional board, florals, topper…"
                      onChange={(event) => updateLine(index, (current) => {
                        const label = event.target.value;
                        const remaining = current.specialCosts?.slice(1) ?? [];
                        return {
                          ...current,
                          specialCosts: label.trim()
                            ? [{ id: special?.id ?? `special-${line.id}`, label, quantity: 1, unitCost: special?.unitCost ?? 0 }, ...remaining]
                            : remaining.length ? remaining : undefined,
                        };
                      })}
                    />
                  </Field>
                  <NumberField
                    id={`line-${line.id}-special-cost`}
                    label="Special add-on cost"
                    prefix="$"
                    value={special?.unitCost ?? 0}
                    onChange={(value) => updateLine(index, (current) => {
                      const remaining = current.specialCosts?.slice(1) ?? [];
                      return {
                        ...current,
                        specialCosts: [{
                          id: special?.id ?? `special-${line.id}`,
                          label: special?.label.trim() || "Special add-on",
                          quantity: 1,
                          unitCost: value,
                        }, ...remaining],
                      };
                    })}
                  />
                </div>
              </fieldset>
            );
          })}
        </div>
      </AdminSectionCard>

      {data.inquiry.event.fulfillmentMethod === "delivery" ? (
        <AdminSectionCard title="Delivery" description="Use round-trip travel and the hands-on setup time required at the venue.">
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField
              id="round-trip-mileage"
              label="Round-trip mileage"
              step="0.1"
              value={input.delivery?.roundTripMiles ?? 0}
              onChange={(value) => setInput((current) => current ? { ...current, delivery: { roundTripMiles: value, setupHours: current.delivery?.setupHours ?? 0, tollsParking: current.delivery?.tollsParking ?? 0 } } : current)}
            />
            <NumberField
              id="delivery-setup-hours"
              label="Delivery setup hours"
              step="0.25"
              value={input.delivery?.setupHours ?? 0}
              onChange={(value) => setInput((current) => current ? { ...current, delivery: { roundTripMiles: current.delivery?.roundTripMiles ?? 0, setupHours: value, tollsParking: current.delivery?.tollsParking ?? 0 } } : current)}
            />
            <NumberField
              id="tolls-parking"
              label="Tolls / parking"
              prefix="$"
              value={input.delivery?.tollsParking ?? 0}
              onChange={(value) => setInput((current) => current ? { ...current, delivery: { roundTripMiles: current.delivery?.roundTripMiles ?? 0, setupHours: current.delivery?.setupHours ?? 0, tollsParking: value } } : current)}
            />
          </div>
        </AdminSectionCard>
      ) : null}

      <AdminSectionCard title="Quote adjustments" description="These controls affect the recommendation and customer total without changing the internal line assumptions.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <NumberField id="rush-fee" label="Rush fee" prefix="$" value={input.rush?.value ?? 0} onChange={(value) => setFixedAdjustment("rush", value)} />
          <NumberField id="contingency" label="Contingency" prefix="$" value={input.contingency?.value ?? 0} onChange={(value) => setFixedAdjustment("contingency", value)} />
          <NumberField id="discount" label="Discount" prefix="$" value={input.discount?.value ?? 0} onChange={(value) => setFixedAdjustment("discount", value)} />
          <NumberField id="tax" label="Tax" suffix="%" step="0.01" value={(input.taxRate ?? profile.defaultTaxRate) * 100} onChange={(value) => setInput((current) => current ? { ...current, taxRate: Math.min(value / 100, 1) } : current)} />
          <NumberField id="deposit" label="Deposit" suffix="%" step="1" value={(input.depositRate ?? profile.defaultDepositRate) * 100} onChange={(value) => setInput((current) => current ? { ...current, depositRate: Math.min(value / 100, 1) } : current)} />
          <NumberField id="validity-days" label="Validity days" step="1" value={input.validityDays ?? profile.defaultQuoteValidityDays} onChange={(value) => setInput((current) => current ? { ...current, validityDays: Math.round(value) } : current)} />
          <NumberField id="final-price" label="Final pre-tax price" prefix="$" value={calculation?.pricing.finalPrice ?? input.finalPrice ?? 0} onChange={(value) => setInput((current) => current ? { ...current, finalPrice: value } : current)} />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Internal quote review" description="Private working figures. Only the copy-ready message in a finalized quote is customer-facing.">
        {calculationState.error ? (
          <p role="alert" className="rounded-2xl border border-rose/25 bg-rose/10 p-4 text-sm text-charcoal">
            {calculationState.error}
          </p>
        ) : calculation ? (
          <>
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              Quote preview updated. Customer total {money(calculation.pricing.customerTotal)}.
              Deposit due {money(calculation.pricing.depositAmount)}.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Labor" value={money(calculation.costs.labor)} />
              <Metric label="Materials" value={money(calculation.costs.materials)} />
              <Metric label="Packaging" value={money(calculation.costs.packaging)} />
              <Metric label="Special add-ons" value={money(calculation.costs.specialCosts)} />
              <Metric label="Overhead" value={money(calculation.costs.fixedOverhead + calculation.costs.variableOverhead)} />
              <Metric
                label="Delivery expenses / minimum"
                value={money(calculation.costs.deliveryExpenses + (calculation.delivery?.minimumAdjustment ?? 0))}
              />
              <Metric label="Contingency" value={money(calculation.costs.contingency)} />
              <Metric label="Internal cost" value={money(calculation.costs.internalTotal)} emphasis />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Suggested price" value={money(calculation.pricing.suggestedPrice)} />
              <Metric label="Recommended price" value={money(calculation.pricing.recommendedPrice)} />
              <Metric label="Final pre-tax price" value={money(calculation.pricing.finalPrice)} emphasis />
              <Metric label="Customer total" value={money(calculation.pricing.customerTotal)} emphasis />
              <Metric label="Deposit due" value={money(calculation.pricing.depositAmount)} />
              <Metric label="Balance due" value={money(calculation.pricing.balanceDue)} />
              <Metric label="Margin" value={percentage(calculation.pricing.margin)} />
              <Metric label="Effective labor recovery" value={effectiveLaborRecovery === null ? "Not available" : `${money(effectiveLaborRecovery)} / hr`} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Rush adjustment" value={money(calculation.adjustments.rush)} />
              <Metric label="Discount applied" value={money(calculation.adjustments.discount)} />
              <Metric label="Tax applied" value={money(calculation.adjustments.tax)} />
              <Metric
                label="Valid through"
                value={calculation.metadata.validThrough ? formatDate(calculation.metadata.validThrough) : "Not set"}
              />
              {calculation.delivery ? (
                <>
                  <Metric label="Mileage expense" value={money(calculation.delivery.mileageCost)} />
                  <Metric label="Delivery labor" value={money(calculation.delivery.laborCost)} />
                  <Metric label="Tolls / parking applied" value={money(calculation.delivery.tollsParking)} />
                  <Metric label="Delivery minimum adjustment" value={money(calculation.delivery.minimumAdjustment)} />
                </>
              ) : null}
            </div>
            <div className="mt-4 space-y-2" aria-label="Quote line outcomes">
              {calculation.lines.map((line) => {
                const inquiryItem = data.inquiry.items.find((item) => item.id === line.id);
                const directCost = line.materialAllowance + line.packagingAllowance +
                  line.specialCosts.reduce((sum, item) => sum + item.totalCost, 0);

                return (
                  <div
                    key={line.id}
                    className="flex flex-col gap-2 rounded-2xl border border-charcoal/8 bg-white/75 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-medium text-charcoal">
                      {inquiryItem?.product_label ?? toTitleCase(line.productKey)}
                    </span>
                    <span className="text-charcoal/64">
                      Line hours: {line.totalHours.toFixed(2)} · Direct materials and packaging: {money(directCost)}
                    </span>
                  </div>
                );
              })}
            </div>
            {calculation.warnings.length ? (
              <div className="mt-4 space-y-2" role="alert" aria-label="Quote warnings">
                {calculation.warnings.map((warning, index) => (
                  <p key={`${warning.code}-${warning.lineId ?? "quote"}-${index}`} className="rounded-2xl border border-gold/25 bg-gold/8 px-4 py-3 text-sm leading-6 text-charcoal/78">
                    {warning.message}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
                No pricing warnings at the current final price.
              </p>
            )}
          </>
        ) : null}
      </AdminSectionCard>

      <AdminSectionCard title="Save and finalize" description="Finalizing locks the saved draft and creates the customer-safe message. It does not send email or create a PDF.">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <form action={saveQuoteDraft} className="flex flex-col gap-3 sm:flex-row">
            <input type="hidden" name="inquiryId" value={data.inquiry.id} />
            <input type="hidden" name="quoteInputJson" value={JSON.stringify(input)} />
            <Button type="submit" disabled={!calculation || isProfileDirty}>Save draft</Button>
            {isProfileDirty ? (
              <p className="max-w-sm text-sm leading-6 text-gold-dark" role="status">
                Save pricing calibration first so the saved draft matches this preview.
              </p>
            ) : null}
          </form>

          {savedDraft ? (
            <form action={finalizeQuoteDraft} className="space-y-2">
              <input type="hidden" name="inquiryId" value={data.inquiry.id} />
              <Button type="submit" disabled={hasUnsavedChanges || !calculation}>
                Finalize saved quote
              </Button>
              <p className="max-w-md text-sm leading-6 text-charcoal/62" aria-live="polite">
                {hasUnsavedChanges
                  ? "Save these edits first. Finalize unlocks when the screen matches the saved draft."
                  : "This saved draft is clean and ready to finalize."}
              </p>
            </form>
          ) : (
            <p className="max-w-md text-sm leading-6 text-charcoal/62">
              Save the first draft to enable finalization.
            </p>
          )}
        </div>
      </AdminSectionCard>

      <QuoteHistory data={data} />
      <PricingCalibration profile={profile} data={data} onProfileChange={setProfile} onPresetChange={updateProductPreset} onPublicStartingPriceChange={updatePublicStartingPrice} onNumberChange={updateProfileNumber} />
    </div>
  );
}

function Field({ children, htmlFor, label }: Readonly<{ children: React.ReactNode; htmlFor: string; label: string }>) {
  return (
    <div className="min-w-0">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function NumberField({
  id,
  label,
  min = 0,
  onChange,
  prefix,
  step = "0.01",
  suffix,
  value,
}: Readonly<{
  id: string;
  label: string;
  min?: number;
  onChange: (value: number) => void;
  prefix?: string;
  step?: string;
  suffix?: string;
  value: number;
}>) {
  const formattedValue = Number.isFinite(value) ? String(value) : "0";
  const [draftValue, setDraftValue] = useState(formattedValue);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Field label={label} htmlFor={id}>
      <div className="relative">
        {prefix ? <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-charcoal/48">{prefix}</span> : null}
        <Input
          id={id}
          type="number"
          min={min}
          step={step}
          value={isEditing ? draftValue : formattedValue}
          className={`${inputClassName()} ${prefix ? "pl-8" : ""} ${suffix ? "pr-10" : ""}`}
          onFocus={() => {
            setDraftValue(formattedValue);
            setIsEditing(true);
          }}
          onChange={(event) => {
            setDraftValue(event.target.value);
            if (event.target.value === "") return;
            onChange(numericValue(event.target.value, min));
          }}
          onBlur={() => setIsEditing(false)}
        />
        {suffix ? <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-charcoal/48">{suffix}</span> : null}
      </div>
    </Field>
  );
}

function Metric({ emphasis = false, label, value }: Readonly<{ emphasis?: boolean; label: string; value: string }>) {
  return (
    <div className={`rounded-[1.35rem] border p-4 ${emphasis ? "border-gold/30 bg-gold/8" : "border-charcoal/8 bg-ivory/55"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/48">{label}</p>
      <p className="mt-2 break-words font-serif text-2xl tracking-[-0.03em] text-charcoal">{value}</p>
    </div>
  );
}

function QuoteHistory({ data }: Readonly<{ data: QuoteBuilderData }>) {
  return (
    <AdminSectionCard title="Quote history" description="Finalized versions remain read-only; the current draft or finalized quote is marked below.">
      {data.quoteVersions.length ? (
        <div className="space-y-3">
          {data.quoteVersions.map((quote) => (
            <article key={quote.id} className="flex flex-col gap-3 rounded-[1.4rem] border border-charcoal/8 bg-ivory/55 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-charcoal">Version {quote.version} · {toTitleCase(quote.status)}</p>
                <p className="mt-1 text-sm text-charcoal/58">{quote.is_current ? "Current version" : "Previous version"} · Updated {formatDate(quote.updated_at)}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-serif text-xl text-charcoal">{money(quote.snapshot?.calculation.pricing.customerTotal ?? quote.final_price)}</p>
                {quote.snapshotNotice ? <p className="mt-1 text-sm text-rose-800" role="alert">{quote.snapshotNotice}</p> : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-[1.4rem] border border-charcoal/8 bg-ivory/55 p-4 text-sm text-charcoal/62">No quote versions have been saved yet.</p>
      )}
    </AdminSectionCard>
  );
}

type CalibrationProps = {
  data: QuoteBuilderData;
  onNumberChange: (
    key:
      | "ownerHourlyRate"
      | "fixedOverheadPerOrder"
      | "variableOverheadRate"
      | "targetMargin"
      | "minimumMargin"
      | "defaultTaxRate"
      | "defaultDepositRate"
      | "defaultQuoteValidityDays",
    value: number,
  ) => void;
  onPresetChange: (productKey: string, complexityKey: string, field: "materialAllowance" | "packagingAllowance" | QuoteStageKey, value: number) => void;
  onPublicStartingPriceChange: (productKey: string, value: number) => void;
  onProfileChange: React.Dispatch<React.SetStateAction<PricingProfile>>;
  profile: PricingProfile;
};

function PricingCalibration({ data, onNumberChange, onPresetChange, onProfileChange, onPublicStartingPriceChange, profile }: Readonly<CalibrationProps>) {
  if (!data.isOwner) return null;

  return (
    <details className="group rounded-[1.75rem] border border-gold/25 bg-white p-4 shadow-soft sm:p-5">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-dark">Owner only</p>
            <h2 className="mt-1 font-serif text-[2rem] tracking-[-0.04em] text-charcoal">Pricing calibration</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-charcoal/64">
              Starter assumptions need owner approval before they are trusted for live quoting. Saving creates profile version {profile.version + 1}; the server verifies the stored version.
            </p>
          </div>
          <span className="rounded-full border border-charcoal/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-charcoal/58 group-open:bg-charcoal group-open:text-ivory">Open</span>
        </div>
      </summary>

      <div className="mt-6 space-y-6">
        <fieldset className="rounded-[1.5rem] border border-charcoal/8 bg-ivory/55 p-4">
          <legend className="px-2 font-serif text-2xl text-charcoal">Global assumptions</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <NumberField id="profile-owner-rate" label="Owner hourly rate" prefix="$" value={profile.ownerHourlyRate} onChange={(value) => onNumberChange("ownerHourlyRate", value)} />
            <NumberField id="profile-fixed-overhead" label="Fixed overhead per order" prefix="$" value={profile.fixedOverheadPerOrder} onChange={(value) => onNumberChange("fixedOverheadPerOrder", value)} />
            <NumberField id="profile-variable-overhead" label="Variable overhead" suffix="%" value={profile.variableOverheadRate * 100} onChange={(value) => onNumberChange("variableOverheadRate", Math.min(value / 100, 1))} />
            <NumberField id="profile-target-margin" label="Target margin" suffix="%" value={profile.targetMargin * 100} onChange={(value) => onNumberChange("targetMargin", Math.min(value / 100, 0.99))} />
            <NumberField id="profile-minimum-margin" label="Minimum margin" suffix="%" value={profile.minimumMargin * 100} onChange={(value) => onNumberChange("minimumMargin", Math.min(value / 100, 0.99))} />
            <NumberField id="profile-mileage" label="Mileage rate" prefix="$" value={profile.delivery.mileageRate} onChange={(value) => onProfileChange((current) => ({ ...current, delivery: { ...current.delivery, mileageRate: value } }))} />
            <NumberField id="profile-delivery-minimum" label="Delivery minimum charge" prefix="$" value={profile.delivery.minimumCharge ?? 0} onChange={(value) => onProfileChange((current) => ({ ...current, delivery: { ...current.delivery, minimumCharge: value } }))} />
            <NumberField id="profile-tax" label="Default tax rate" suffix="%" value={profile.defaultTaxRate * 100} onChange={(value) => onNumberChange("defaultTaxRate", Math.min(value / 100, 1))} />
            <NumberField id="profile-deposit" label="Default deposit rate" suffix="%" value={profile.defaultDepositRate * 100} onChange={(value) => onNumberChange("defaultDepositRate", Math.min(value / 100, 1))} />
            <NumberField id="profile-validity" label="Default quote validity days" step="1" value={profile.defaultQuoteValidityDays} onChange={(value) => onNumberChange("defaultQuoteValidityDays", Math.round(value))} />
          </div>
        </fieldset>

        <div className="space-y-5">
          {Object.entries(profile.productPresets).map(([productKey, product]) => (
            <fieldset key={productKey} className="rounded-[1.5rem] border border-charcoal/8 bg-paper/75 p-4">
              <legend className="px-2 font-serif text-2xl text-charcoal">{product.label}</legend>
              <div className="mt-3 max-w-xs">
                <NumberField
                  id={`${productKey}-public-starting-price`}
                  label="Public starting price"
                  prefix="$"
                  value={product.publicStartingPrice ?? 0}
                  onChange={(value) => onPublicStartingPriceChange(productKey, value)}
                />
              </div>
              <p className="mt-2 text-sm text-charcoal/60">This floor drives the below-public-price warning. Display labels remain read-only here.</p>
              <div className="mt-4 space-y-4">
                {Object.entries(product.complexities).map(([complexityKey, preset]) => (
                  <div key={complexityKey} className="rounded-[1.35rem] border border-charcoal/8 bg-white/85 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-charcoal/60">{toTitleCase(complexityKey)}</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <NumberField id={`${productKey}-${complexityKey}-material`} label="Material allowance" prefix="$" value={preset.materialAllowance} onChange={(value) => onPresetChange(productKey, complexityKey, "materialAllowance", value)} />
                      <NumberField id={`${productKey}-${complexityKey}-packaging`} label="Packaging allowance" prefix="$" value={preset.packagingAllowance} onChange={(value) => onPresetChange(productKey, complexityKey, "packagingAllowance", value)} />
                      {quoteStageKeys.map((stage) => (
                        <NumberField key={stage} id={`${productKey}-${complexityKey}-${stage}`} label={`${allStageLabels[stage]} hours`} step="0.25" value={preset.stageHours[stage]} onChange={(value) => onPresetChange(productKey, complexityKey, stage, value)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <form action={savePricingProfile}>
          <input type="hidden" name="inquiryId" value={data.inquiry.id} />
          <input type="hidden" name="pricingProfileJson" value={JSON.stringify(profile)} />
          <Button type="submit">Save pricing profile</Button>
        </form>
      </div>
    </details>
  );
}
