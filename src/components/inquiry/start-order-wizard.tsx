"use client";

import { type ReactNode, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  MapPin,
  PartyPopper,
  PhoneCall,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  budgetFlexibilityOptions,
  budgetRangeOptions,
  cakeShapeOptions,
  createDefaultInquiryItem,
  eventTypeSuggestions,
  getBudgetFlexibilityLabel,
  getBudgetRangeLabel,
  icingStyleOptions,
  inquiryStepTitles,
  type InquiryFeatureFlags,
} from "@/lib/inquiries/config";
import { estimateInquiry, getProductDisplayLabel, getStartingPrice } from "@/lib/pricing";
import type {
  InquiryCatalogItem,
  InquirySubmissionResponse,
} from "@/lib/inquiries/types";
import {
  createEmptyInquiryValues,
  inquiryContactSchema,
  inquiryEventDetailsSchema,
  inquiryItemDetailsSchema,
  inquirySchema,
  inquirySelectionSchema,
  inquiryInspirationSchema,
  normalizeInquiryFormValues,
  validateInspirationUploads,
  type InquiryFormValues,
} from "@/lib/validations/inquiry";
import type { InquiryProductItem, ProductType } from "@/types/domain";
import type { InquiryPricingBaseline } from "@/lib/pricing";

type StartOrderWizardProps = {
  catalog: InquiryCatalogItem[];
  featureFlags: InquiryFeatureFlags;
  pricingBaseline: InquiryPricingBaseline;
  deliveryRange: [number, number];
};

type UploadDraft = {
  id: string;
  file: File;
};

type ErrorMap = Record<string, string>;

function flattenIssues(issues: Array<{ path: (string | number)[]; message: string }>) {
  return issues.reduce<ErrorMap>((accumulator, issue) => {
    const key = issue.path.join(".");

    if (!accumulator[key]) {
      accumulator[key] = issue.message;
    }

    return accumulator;
  }, {});
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.round(size / 102.4) / 10} KB`;
  }

  return `${Math.round(size / 1024 / 102.4) / 10} MB`;
}

function StepMarker({
  active,
  complete,
  index,
  title,
}: {
  active: boolean;
  complete: boolean;
  index: number;
  title: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition",
          complete
            ? "border-charcoal bg-charcoal text-ivory"
            : active
              ? "border-gold bg-gold/15 text-charcoal"
              : "border-charcoal/10 bg-white text-charcoal/48",
        )}
      >
        {complete ? <Check className="h-4 w-4" /> : index + 1}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal/45">Step {index + 1}</p>
        <p className={cn("truncate text-sm font-medium", active ? "text-charcoal" : "text-charcoal/60")}>
          {title}
        </p>
      </div>
    </div>
  );
}

function InlineError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-rose-700">{message}</p>;
}

function SelectionButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full border px-4 py-2 text-left text-sm transition",
        active
          ? "border-charcoal bg-charcoal text-ivory"
          : "border-charcoal/12 bg-white text-charcoal hover:border-charcoal/30",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function StatRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-charcoal/8 py-3 last:border-none last:pb-0">
      <p className="text-sm text-charcoal/55">{label}</p>
      <div className="text-right text-sm font-medium text-charcoal">{value}</div>
    </div>
  );
}

function findStepForErrors(errors: ErrorMap) {
  const keys = Object.keys(errors);
  if (keys.some((key) => key.startsWith("event") || key.startsWith("guestCount") || key.startsWith("fulfillmentMethod") || key.startsWith("deliveryZip") || key.startsWith("budget"))) {
    return 0;
  }
  if (keys.some((key) => key === "orderItems")) {
    return 1;
  }
  if (keys.some((key) => key.startsWith("orderItems."))) {
    return 2;
  }
  if (keys.some((key) => key.startsWith("colorPalette") || key.startsWith("inspiration") || key === "inspirationUploads")) {
    return 3;
  }
  return 4;
}

export function StartOrderWizard({
  catalog,
  featureFlags,
  pricingBaseline,
  deliveryRange,
}: StartOrderWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [activeItemType, setActiveItemType] = useState<ProductType | null>(null);
  const [values, setValues] = useState<InquiryFormValues>(() => createEmptyInquiryValues());
  const [uploads, setUploads] = useState<UploadDraft[]>([]);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<InquirySubmissionResponse | null>(
    null,
  );

  const normalizedValues = normalizeInquiryFormValues(values);
  const selectedItems = normalizedValues.orderItems;
  const catalogMap = catalog.reduce(
    (accumulator, item) => {
      accumulator[item.productType] = item;
      return accumulator;
    },
    {} as Record<ProductType, InquiryCatalogItem>,
  );
  const estimate = estimateInquiry(normalizedValues, {
    pricing: pricingBaseline,
    deliveryRange,
  });

  useEffect(() => {
    if (selectedItems.length === 0) {
      setActiveItemType(null);
      return;
    }

    if (!activeItemType || !selectedItems.some((item) => item.productType === activeItemType)) {
      setActiveItemType(selectedItems[0].productType);
    }
  }, [activeItemType, selectedItems]);

  const activeItem =
    selectedItems.find((item) => item.productType === activeItemType) ?? selectedItems[0];

  const itemPath = (productType: ProductType, field: keyof InquiryProductItem) => {
    const index = normalizedValues.orderItems.findIndex(
      (item) => item.productType === productType,
    );

    return index === -1 ? field : `orderItems.${index}.${field}`;
  };

  const setFieldValue = <Key extends keyof InquiryFormValues>(
    key: Key,
    value: InquiryFormValues[Key],
  ) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key as string];

      if (key === "fulfillmentMethod" && value === "pickup") {
        delete next.deliveryZip;
      }

      return next;
    });
  };

  const setNumericValue = (
    key: "guestCount",
    rawValue: string,
  ) => {
    const parsed = rawValue === "" ? undefined : Number(rawValue);
    setFieldValue(
      key,
      Number.isFinite(parsed as number) ? parsed : undefined,
    );
  };

  const toggleProductSelection = (productType: ProductType) => {
    setValues((current) => {
      const alreadySelected = current.orderItems.some(
        (item) => item.productType === productType,
      );

      const nextItems = alreadySelected
        ? current.orderItems.filter((item) => item.productType !== productType)
        : [...current.orderItems, createDefaultInquiryItem(productType)];

      nextItems.sort(
        (left, right) =>
          catalog.findIndex((item) => item.productType === left.productType) -
          catalog.findIndex((item) => item.productType === right.productType),
      );

      return {
        ...current,
        orderItems: nextItems,
      };
    });

    setErrors((current) => {
      const next = { ...current };
      delete next.orderItems;
      return next;
    });
  };

  const updateOrderItem = (
    productType: ProductType,
    patch: Partial<InquiryProductItem>,
  ) => {
    setValues((current) => ({
      ...current,
      orderItems: current.orderItems.map((item) =>
        item.productType === productType ? { ...item, ...patch } : item,
      ),
    }));

    setErrors((current) => {
      const next = { ...current };

      Object.keys(patch).forEach((field) => {
        delete next[itemPath(productType, field as keyof InquiryProductItem)];
      });

      return next;
    });
  };

  const addInspirationFiles = (fileList: FileList | null) => {
    if (!fileList) {
      return;
    }

    const nextUploads = [
      ...uploads,
      ...Array.from(fileList).map((file) => ({
        id: crypto.randomUUID(),
        file,
      })),
    ];

    setUploads(nextUploads);
    setErrors((current) => {
      const next = { ...current };
      delete next.inspirationUploads;
      return next;
    });
  };

  const removeUpload = (uploadId: string) => {
    setUploads((current) => current.filter((upload) => upload.id !== uploadId));
  };

  const setInspirationLink = (index: number, value: string) => {
    const nextLinks = [...values.inspirationLinks];
    nextLinks[index] = value;
    setFieldValue("inspirationLinks", nextLinks);
  };

  const addInspirationLink = () => {
    setFieldValue("inspirationLinks", [...values.inspirationLinks, ""]);
  };

  const removeInspirationLink = (index: number) => {
    setFieldValue(
      "inspirationLinks",
      values.inspirationLinks.filter((_, linkIndex) => linkIndex !== index),
    );
  };

  const validateStep = (stepIndex: number, nextValues = values, nextUploads = uploads) => {
    const preparedValues = normalizeInquiryFormValues(nextValues);
    let nextErrors: ErrorMap = {};

    if (stepIndex === 0) {
      const result = inquiryEventDetailsSchema.safeParse({
        eventType: preparedValues.eventType,
        eventDate: preparedValues.eventDate,
        guestCount: preparedValues.guestCount,
        fulfillmentMethod: preparedValues.fulfillmentMethod,
        deliveryZip: preparedValues.deliveryZip,
        budgetRange: preparedValues.budgetRange,
        budgetFlexibility: preparedValues.budgetFlexibility,
      });

      if (!result.success) {
        nextErrors = flattenIssues(result.error.issues);
      }
    }

    if (stepIndex === 1) {
      const result = inquirySelectionSchema.safeParse({
        orderItems: preparedValues.orderItems.map((item) => ({
          productType: item.productType,
        })),
      });

      if (!result.success) {
        nextErrors = flattenIssues(result.error.issues);
      }
    }

    if (stepIndex === 2) {
      const result = inquiryItemDetailsSchema.safeParse({
        orderItems: preparedValues.orderItems,
      });

      if (!result.success) {
        nextErrors = flattenIssues(result.error.issues);
      }
    }

    if (stepIndex === 3) {
      const result = inquiryInspirationSchema.safeParse({
        colorPalette: preparedValues.colorPalette,
        inspirationLinks: preparedValues.inspirationLinks,
        inspirationText: preparedValues.inspirationText,
      });

      if (!result.success) {
        nextErrors = flattenIssues(result.error.issues);
      }

      const uploadIssues = validateInspirationUploads(
        nextUploads.map((upload) => upload.file),
        featureFlags,
      );

      if (uploadIssues.length > 0) {
        nextErrors.inspirationUploads = uploadIssues[0];
      }

      if (!featureFlags.linkFallbackEnabled && preparedValues.inspirationLinks.length > 0) {
        nextErrors.inspirationLinks =
          "Reference links are turned off right now. Use image uploads or notes instead.";
      }
    }

    if (stepIndex === 4) {
      const result = inquiryContactSchema.safeParse({
        customerName: preparedValues.customerName,
        customerEmail: preparedValues.customerEmail,
        customerPhone: preparedValues.customerPhone,
        instagramHandle: preparedValues.instagramHandle,
        preferredContact: preparedValues.preferredContact,
        howDidYouHear: preparedValues.howDidYouHear,
        additionalNotes: preparedValues.additionalNotes,
      });

      if (!result.success) {
        nextErrors = flattenIssues(result.error.issues);
      }
    }

    setErrors((current) => ({
      ...current,
      ...nextErrors,
    }));

    if (Object.keys(nextErrors).length > 0) {
      if (stepIndex === 2) {
        const firstInvalidItemKey = Object.keys(nextErrors).find((key) =>
          key.startsWith("orderItems."),
        );

        if (firstInvalidItemKey) {
          const itemIndex = Number(firstInvalidItemKey.split(".")[1]);
          const nextItem = preparedValues.orderItems[itemIndex];

          if (nextItem) {
            setActiveItemType(nextItem.productType);
          }
        }
      }

      return false;
    }

    return true;
  };

  const goToNextStep = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setCurrentStep((current) => Math.min(current + 1, inquiryStepTitles.length - 1));
  };

  const goToPreviousStep = () => {
    setCurrentStep((current) => Math.max(current - 1, 0));
  };

  const submitInquiryForm = async () => {
    setSubmitError(null);
    setErrors({});

    for (let stepIndex = 0; stepIndex < inquiryStepTitles.length; stepIndex += 1) {
      const valid = validateStep(stepIndex);

      if (!valid) {
        setCurrentStep(stepIndex);
        return;
      }
    }

    const preparedValues = normalizeInquiryFormValues(values);
    const result = inquirySchema.safeParse(preparedValues);

    if (!result.success) {
      const nextErrors = flattenIssues(result.error.issues);
      setErrors(nextErrors);
      setCurrentStep(findStepForErrors(nextErrors));
      return;
    }

    if (!featureFlags.linkFallbackEnabled && preparedValues.inspirationLinks.length > 0) {
      setErrors({
        inspirationLinks:
          "Reference links are turned off right now. Use image uploads or notes instead.",
      });
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("payload", JSON.stringify(result.data));

      uploads.forEach((upload) => {
        formData.append("inspirationFiles", upload.file);
      });

      const response = await fetch("/api/inquiries", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as
        | InquirySubmissionResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "We could not submit the inquiry right now.",
        );
      }

      setSubmissionResult(payload as InquirySubmissionResponse);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not submit the inquiry right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submissionResult) {
    return (
      <section className="section-shell pb-20">
        <div className="grain-surface overflow-hidden rounded-[2.4rem] border border-charcoal/10 bg-white p-8 shadow-soft sm:p-10 lg:p-12">
          <div className="max-w-3xl space-y-6">
            <Badge>Inquiry received</Badge>
            <div className="space-y-4">
              <h2 className="font-serif text-4xl tracking-[-0.04em] text-charcoal sm:text-5xl">
                Your celebration details are in.
              </h2>
              <p className="max-w-2xl text-base leading-8 text-charcoal/72">
                We saved everything under{" "}
                <span className="font-semibold text-charcoal">
                  {submissionResult.referenceCode}
                </span>
                . The Sweet Fork can now review the event scope, product mix, and inspiration
                together before the first reply goes out.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.8rem] border border-charcoal/8 bg-cream/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Estimate range
                </p>
                <p className="mt-3 font-serif text-3xl tracking-[-0.04em] text-charcoal">
                  {formatCurrency(submissionResult.estimate.minimum)} to{" "}
                  {formatCurrency(submissionResult.estimate.maximum)}
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-charcoal/8 bg-cream/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Items included
                </p>
                <p className="mt-3 text-lg font-medium text-charcoal">
                  {normalizedValues.orderItems.length} selection
                  {normalizedValues.orderItems.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-charcoal/8 bg-cream/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Uploads saved
                </p>
                <p className="mt-3 text-lg font-medium text-charcoal">
                  {submissionResult.uploadedAssetCount}
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-charcoal/8 bg-charcoal px-6 py-6 text-ivory">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold/70">
                What happens next
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div>
                  <p className="font-medium">1. Review</p>
                  <p className="mt-1 text-sm leading-7 text-ivory/70">
                    Your inquiry, items, and inspiration assets are now grouped in one record.
                  </p>
                </div>
                <div>
                  <p className="font-medium">2. Estimate check</p>
                  <p className="mt-1 text-sm leading-7 text-ivory/70">
                    The first-pass estimate is attached so quoting can start from the full picture.
                  </p>
                </div>
                <div>
                  <p className="font-medium">3. Follow-up</p>
                  <p className="mt-1 text-sm leading-7 text-ivory/70">
                    You can expect a reply once availability, scope, and design direction are reviewed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-shell pb-20">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="grain-surface overflow-hidden rounded-[2.4rem] border border-charcoal/10 bg-white shadow-soft">
          <div className="border-b border-charcoal/8 bg-cream/70 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge>Start Order</Badge>
                <p className="text-sm text-charcoal/60">
                  One guided inquiry for the full celebration.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                <div className="space-y-3">
                  <h2 className="font-serif text-4xl tracking-[-0.04em] text-charcoal sm:text-5xl">
                    A premium intake that keeps the details feeling clear, not heavy.
                  </h2>
                  <p className="max-w-2xl text-base leading-8 text-charcoal/70">
                    Share the event, choose one or several sweets, add inspiration, and review
                    everything before you send. You can move backward at any point without
                    losing progress.
                  </p>
                </div>
                <div className="rounded-[1.8rem] border border-charcoal/8 bg-white px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                    Current step
                  </p>
                  <p className="mt-3 font-serif text-3xl tracking-[-0.04em] text-charcoal">
                    {inquiryStepTitles[currentStep]}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-charcoal/65">
                    {currentStep + 1} of {inquiryStepTitles.length}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-1">
                {inquiryStepTitles.map((title, index) => (
                  <StepMarker
                    key={title}
                    active={currentStep === index}
                    complete={index < currentStep}
                    index={index}
                    title={title}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-8 sm:py-10">
            {currentStep === 0 ? (
              <div className="space-y-8">
                <div className="grid gap-4 rounded-[2rem] border border-charcoal/8 bg-cream/60 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                      Event details
                    </p>
                    <p className="text-sm leading-7 text-charcoal/68">
                      Start with the celebration itself so the product mix and quote begin with the
                      right context.
                    </p>
                  </div>
                  <CalendarDays className="h-6 w-6 text-charcoal/45" />
                </div>

                <div>
                  <Label htmlFor="event-type">What are you celebrating?</Label>
                  <Input
                    id="event-type"
                    value={values.eventType}
                    onChange={(event) => setFieldValue("eventType", event.target.value)}
                    placeholder="Birthday, wedding, shower, launch, holiday gathering..."
                  />
                  <InlineError message={errors.eventType} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {eventTypeSuggestions.map((suggestion) => (
                      <SelectionButton
                        key={suggestion}
                        active={values.eventType.toLowerCase() === suggestion.toLowerCase()}
                        onClick={() => setFieldValue("eventType", suggestion)}
                      >
                        {suggestion}
                      </SelectionButton>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="event-date">Event date</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={values.eventDate}
                      onChange={(event) => setFieldValue("eventDate", event.target.value)}
                    />
                    <InlineError message={errors.eventDate} />
                  </div>
                  <div>
                    <Label htmlFor="guest-count">Guest count</Label>
                    <Input
                      id="guest-count"
                      inputMode="numeric"
                      value={values.guestCount ?? ""}
                      onChange={(event) => setNumericValue("guestCount", event.target.value)}
                      placeholder="Approximate number of guests"
                    />
                    <InlineError message={errors.guestCount} />
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                  <div className="space-y-3">
                    <Label>Fulfillment type</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <SelectionButton
                        active={values.fulfillmentMethod === "pickup"}
                        onClick={() => setFieldValue("fulfillmentMethod", "pickup")}
                      >
                        Pickup
                      </SelectionButton>
                      <SelectionButton
                        active={values.fulfillmentMethod === "delivery"}
                        onClick={() => setFieldValue("fulfillmentMethod", "delivery")}
                      >
                        Delivery
                      </SelectionButton>
                    </div>
                    <InlineError message={errors.fulfillmentMethod} />
                  </div>

                  <div>
                    <Label htmlFor="delivery-zip">Delivery ZIP</Label>
                    <Input
                      id="delivery-zip"
                      inputMode="numeric"
                      value={values.deliveryZip ?? ""}
                      onChange={(event) => setFieldValue("deliveryZip", event.target.value)}
                      placeholder={
                        values.fulfillmentMethod === "delivery"
                          ? "Required for delivery requests"
                          : "Only needed if delivery is selected"
                      }
                    />
                    <InlineError message={errors.deliveryZip} />
                  </div>
                </div>

                <div>
                  <Label>Overall budget range</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {budgetRangeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={cn(
                          "rounded-[1.6rem] border p-4 text-left transition",
                          values.budgetRange === option.value
                            ? "border-charcoal bg-charcoal text-ivory"
                            : "border-charcoal/10 bg-white hover:border-charcoal/30",
                        )}
                        onClick={() => setFieldValue("budgetRange", option.value)}
                      >
                        <p className="text-sm font-semibold">{option.label}</p>
                        <p
                          className={cn(
                            "mt-2 text-sm leading-7",
                            values.budgetRange === option.value
                              ? "text-ivory/72"
                              : "text-charcoal/62",
                          )}
                        >
                          {option.note}
                        </p>
                      </button>
                    ))}
                  </div>
                  <InlineError message={errors.budgetRange} />
                </div>

                <div>
                  <Label>Budget flexibility</Label>
                  <div className="grid gap-3 md:grid-cols-3">
                    {budgetFlexibilityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={cn(
                          "rounded-[1.6rem] border p-4 text-left transition",
                          values.budgetFlexibility === option.value
                            ? "border-charcoal bg-charcoal text-ivory"
                            : "border-charcoal/10 bg-white hover:border-charcoal/30",
                        )}
                        onClick={() => setFieldValue("budgetFlexibility", option.value)}
                      >
                        <p className="text-sm font-semibold">{option.label}</p>
                        <p
                          className={cn(
                            "mt-2 text-sm leading-7",
                            values.budgetFlexibility === option.value
                              ? "text-ivory/72"
                              : "text-charcoal/62",
                          )}
                        >
                          {option.note}
                        </p>
                      </button>
                    ))}
                  </div>
                  <InlineError message={errors.budgetFlexibility} />
                </div>
              </div>
            ) : null}

            {currentStep === 1 ? (
              <div className="space-y-8">
                <div className="grid gap-4 rounded-[2rem] border border-charcoal/8 bg-cream/60 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                      Product mix
                    </p>
                    <p className="text-sm leading-7 text-charcoal/68">
                      Select every sweet you want us to consider for this event. One inquiry can
                      cover the full dessert story.
                    </p>
                  </div>
                  <PartyPopper className="h-6 w-6 text-charcoal/45" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {catalog.map((product) => {
                    const selected = selectedItems.some(
                      (item) => item.productType === product.productType,
                    );

                    return (
                      <button
                        key={product.productType}
                        type="button"
                        className={cn(
                          "rounded-[1.9rem] border p-5 text-left transition",
                          selected
                            ? "border-charcoal bg-charcoal text-ivory"
                            : "border-charcoal/10 bg-white hover:border-charcoal/30",
                        )}
                        onClick={() => toggleProductSelection(product.productType)}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-serif text-3xl tracking-[-0.04em]">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2">
                            {product.requiresConsultation ? (
                              <Badge
                                className={cn(
                                  selected
                                    ? "border-gold/30 bg-gold/12 text-ivory"
                                    : undefined,
                                )}
                              >
                                Consultation-led
                              </Badge>
                            ) : null}
                            {selected ? (
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ivory text-charcoal">
                                <Check className="h-4 w-4" />
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <p
                          className={cn(
                            "mt-3 text-sm leading-7",
                            selected ? "text-ivory/72" : "text-charcoal/68",
                          )}
                        >
                          {product.shortDescription}
                        </p>
                        <div className="mt-5 flex items-center justify-between gap-4">
                          <div>
                            <p
                              className={cn(
                                "text-[11px] font-semibold uppercase tracking-[0.18em]",
                                selected ? "text-gold/75" : "text-charcoal/45",
                              )}
                            >
                              Starting at
                            </p>
                            <p className="mt-1 text-lg font-medium">
                              {formatCurrency(
                                getStartingPrice(product.productType, pricingBaseline),
                              )}
                            </p>
                          </div>
                          <p
                            className={cn(
                              "text-sm font-medium",
                              selected ? "text-ivory" : "text-charcoal/70",
                            )}
                          >
                            {selected ? "Selected" : "Add to inquiry"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <InlineError message={errors.orderItems} />
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="space-y-8">
                <div className="grid gap-4 rounded-[2rem] border border-charcoal/8 bg-cream/60 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                      Item details
                    </p>
                    <p className="text-sm leading-7 text-charcoal/68">
                      Each selected product gets its own detail panel so the quote can reflect
                      counts, servings, finishes, and design direction cleanly.
                    </p>
                  </div>
                  <Sparkles className="h-6 w-6 text-charcoal/45" />
                </div>

                <div className="flex gap-3 overflow-x-auto pb-1">
                  {selectedItems.map((item) => {
                    const ready = inquiryItemDetailsSchema.safeParse({
                      orderItems: [item],
                    }).success;

                    return (
                      <button
                        key={item.productType}
                        type="button"
                        className={cn(
                          "min-w-fit rounded-full border px-4 py-3 text-left transition",
                          activeItem?.productType === item.productType
                            ? "border-charcoal bg-charcoal text-ivory"
                            : "border-charcoal/10 bg-white text-charcoal",
                        )}
                        onClick={() => setActiveItemType(item.productType)}
                      >
                        <p className="text-sm font-medium">
                          {catalogMap[item.productType]?.name ?? getProductDisplayLabel(item.productType)}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-xs uppercase tracking-[0.16em]",
                            activeItem?.productType === item.productType
                              ? "text-gold/75"
                              : ready
                                ? "text-charcoal/50"
                                : "text-rose-700",
                          )}
                        >
                          {ready ? "Ready" : "Needs details"}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {activeItem ? (
                  <div className="space-y-6 rounded-[2rem] border border-charcoal/10 bg-white p-6 shadow-soft">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                          Active selection
                        </p>
                        <h3 className="mt-2 font-serif text-4xl tracking-[-0.04em] text-charcoal">
                          {catalogMap[activeItem.productType]?.name ??
                            getProductDisplayLabel(activeItem.productType)}
                        </h3>
                      </div>
                      {catalogMap[activeItem.productType]?.requiresConsultation ? (
                        <Badge>Consultation-led</Badge>
                      ) : null}
                    </div>

                    {(activeItem.productType === "custom-cake" ||
                      activeItem.productType === "wedding-cake") && (
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <Label htmlFor={`${activeItem.productType}-servings`}>
                            Estimated servings
                          </Label>
                          <Input
                            id={`${activeItem.productType}-servings`}
                            inputMode="numeric"
                            value={
                              activeItem.productType === "wedding-cake"
                                ? activeItem.weddingServings ?? activeItem.servings ?? ""
                                : activeItem.servings ?? ""
                            }
                            onChange={(event) =>
                              updateOrderItem(activeItem.productType, {
                                servings:
                                  activeItem.productType === "wedding-cake"
                                    ? undefined
                                    : event.target.value === ""
                                      ? undefined
                                      : Number(event.target.value),
                                weddingServings:
                                  activeItem.productType === "wedding-cake"
                                    ? event.target.value === ""
                                      ? undefined
                                      : Number(event.target.value)
                                    : undefined,
                              })
                            }
                            placeholder="How many servings do you need?"
                          />
                          <InlineError
                            message={
                              errors[itemPath(activeItem.productType, "servings")] ??
                              errors[itemPath(activeItem.productType, "weddingServings")]
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${activeItem.productType}-tiers`}>Tier count</Label>
                          <Input
                            id={`${activeItem.productType}-tiers`}
                            inputMode="numeric"
                            value={activeItem.tiers ?? ""}
                            onChange={(event) =>
                              updateOrderItem(activeItem.productType, {
                                tiers:
                                  event.target.value === ""
                                    ? undefined
                                    : Number(event.target.value),
                              })
                            }
                            placeholder="Optional"
                          />
                          <InlineError
                            message={errors[itemPath(activeItem.productType, "tiers")]}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${activeItem.productType}-shape`}>Shape</Label>
                          <Select
                            id={`${activeItem.productType}-shape`}
                            value={activeItem.shape ?? ""}
                            onChange={(event) =>
                              updateOrderItem(activeItem.productType, {
                                shape:
                                  event.target.value === ""
                                    ? undefined
                                    : (event.target.value as InquiryProductItem["shape"]),
                              })
                            }
                          >
                            <option value="">Select a shape</option>
                            {cakeShapeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`${activeItem.productType}-icing`}>Finish style</Label>
                          <Select
                            id={`${activeItem.productType}-icing`}
                            value={activeItem.icingStyle ?? ""}
                            onChange={(event) =>
                              updateOrderItem(activeItem.productType, {
                                icingStyle:
                                  event.target.value === ""
                                    ? undefined
                                    : (event.target.value as InquiryProductItem["icingStyle"]),
                              })
                            }
                          >
                            <option value="">Select a finish</option>
                            {icingStyleOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    )}

                    {activeItem.productType === "cupcakes" && (
                      <div>
                        <Label htmlFor="cupcake-count">Cupcake count</Label>
                        <Input
                          id="cupcake-count"
                          inputMode="numeric"
                          value={activeItem.cupcakeCount ?? ""}
                          onChange={(event) =>
                            updateOrderItem("cupcakes", {
                              cupcakeCount:
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                            })
                          }
                          placeholder="Example: 24 or 48"
                        />
                        <InlineError
                          message={errors[itemPath(activeItem.productType, "cupcakeCount")]}
                        />
                      </div>
                    )}

                    {activeItem.productType === "sugar-cookies" && (
                      <div>
                        <Label htmlFor="cookie-count">Cookie count</Label>
                        <Input
                          id="cookie-count"
                          inputMode="numeric"
                          value={activeItem.cookieCount ?? ""}
                          onChange={(event) =>
                            updateOrderItem("sugar-cookies", {
                              cookieCount:
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                            })
                          }
                          placeholder="Example: 24 or 48"
                        />
                        <InlineError
                          message={errors[itemPath(activeItem.productType, "cookieCount")]}
                        />
                      </div>
                    )}

                    {activeItem.productType === "macarons" && (
                      <div>
                        <Label htmlFor="macaron-count">Macaron count</Label>
                        <Input
                          id="macaron-count"
                          inputMode="numeric"
                          value={activeItem.macaronCount ?? ""}
                          onChange={(event) =>
                            updateOrderItem("macarons", {
                              macaronCount:
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                            })
                          }
                          placeholder="Example: 24 or 48"
                        />
                        <InlineError
                          message={errors[itemPath(activeItem.productType, "macaronCount")]}
                        />
                      </div>
                    )}

                    {activeItem.productType === "diy-kit" && (
                      <div>
                        <Label htmlFor="kit-count">Kit quantity</Label>
                        <Input
                          id="kit-count"
                          inputMode="numeric"
                          value={activeItem.kitCount ?? ""}
                          onChange={(event) =>
                            updateOrderItem("diy-kit", {
                              kitCount:
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                            })
                          }
                          placeholder="How many kits do you need?"
                        />
                        <InlineError
                          message={errors[itemPath(activeItem.productType, "kitCount")]}
                        />
                      </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <Label htmlFor={`${activeItem.productType}-palette`}>Item color palette</Label>
                        <Input
                          id={`${activeItem.productType}-palette`}
                          value={activeItem.colorPalette ?? ""}
                          onChange={(event) =>
                            updateOrderItem(activeItem.productType, {
                              colorPalette: event.target.value,
                            })
                          }
                          placeholder="Ivory, sage, soft gold, blush..."
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${activeItem.productType}-topper`}>Topper or wording</Label>
                        <Input
                          id={`${activeItem.productType}-topper`}
                          value={activeItem.topperText ?? ""}
                          onChange={(event) =>
                            updateOrderItem(activeItem.productType, {
                              topperText: event.target.value,
                            })
                          }
                          placeholder="Optional wording or topper notes"
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div>
                        <Label htmlFor={`${activeItem.productType}-flavor`}>Flavor notes</Label>
                        <Textarea
                          id={`${activeItem.productType}-flavor`}
                          value={activeItem.flavorNotes ?? ""}
                          onChange={(event) =>
                            updateOrderItem(activeItem.productType, {
                              flavorNotes: event.target.value,
                            })
                          }
                          placeholder="Favorite flavors, fillings, or ingredients to highlight"
                          className="min-h-[120px]"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${activeItem.productType}-design`}>Design notes</Label>
                        <Textarea
                          id={`${activeItem.productType}-design`}
                          value={activeItem.designNotes ?? ""}
                          onChange={(event) =>
                            updateOrderItem(activeItem.productType, {
                              designNotes: event.target.value,
                            })
                          }
                          placeholder="Overall direction, motifs, florals, finish, packaging, or styling cues"
                          className="min-h-[120px]"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`${activeItem.productType}-inspiration`}>
                        Item-specific inspiration notes
                      </Label>
                      <Textarea
                        id={`${activeItem.productType}-inspiration`}
                        value={activeItem.inspirationNotes ?? ""}
                        onChange={(event) =>
                          updateOrderItem(activeItem.productType, {
                            inspirationNotes: event.target.value,
                          })
                        }
                        placeholder="Anything about this item that should stand out in the proposal"
                        className="min-h-[120px]"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="space-y-8">
                <div className="grid gap-4 rounded-[2rem] border border-charcoal/8 bg-cream/60 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                      Inspiration
                    </p>
                    <p className="text-sm leading-7 text-charcoal/68">
                      Upload direct references when you have them, then add links or notes if they
                      tell the story better.
                    </p>
                  </div>
                  <ImagePlus className="h-6 w-6 text-charcoal/45" />
                </div>

                <div>
                  <Label htmlFor="overall-palette">Overall palette or mood</Label>
                  <Input
                    id="overall-palette"
                    value={values.colorPalette ?? ""}
                    onChange={(event) => setFieldValue("colorPalette", event.target.value)}
                    placeholder="Romantic neutrals, polished black and ivory, cheerful pastels..."
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="mb-0">Image uploads</Label>
                      <p className="text-xs uppercase tracking-[0.16em] text-charcoal/45">
                        {featureFlags.uploadsEnabled ? "Enabled" : "Unavailable"}
                      </p>
                    </div>
                    <label
                      className={cn(
                        "flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed px-6 py-8 text-center transition",
                        featureFlags.uploadsEnabled
                          ? "border-charcoal/18 bg-cream/45 hover:border-charcoal/35"
                          : "cursor-not-allowed border-charcoal/10 bg-charcoal/3 text-charcoal/40",
                      )}
                    >
                      <ImagePlus className="h-8 w-8" />
                      <p className="mt-4 font-medium text-charcoal">
                        {featureFlags.uploadsEnabled
                          ? "Drop inspiration images here or browse"
                          : "Direct uploads are turned off right now"}
                      </p>
                      <p className="mt-2 max-w-sm text-sm leading-7 text-charcoal/60">
                        Add cake references, invitation details, floral cues, mood boards, or
                        dessert-table inspiration.
                      </p>
                      {featureFlags.uploadsEnabled ? (
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={(event) => addInspirationFiles(event.target.files)}
                        />
                      ) : null}
                    </label>
                    <InlineError message={errors.inspirationUploads} />

                    {uploads.length > 0 ? (
                      <div className="space-y-3">
                        {uploads.map((upload) => (
                          <div
                            key={upload.id}
                            className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-charcoal/8 bg-white px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-charcoal">
                                {upload.file.name}
                              </p>
                              <p className="text-xs uppercase tracking-[0.16em] text-charcoal/45">
                                {formatFileSize(upload.file.size)}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-charcoal/10 text-charcoal transition hover:border-charcoal/30"
                              onClick={() => removeUpload(upload.id)}
                              aria-label={`Remove ${upload.file.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <Label className="mb-0">Reference links</Label>
                        <p className="text-xs uppercase tracking-[0.16em] text-charcoal/45">
                          {featureFlags.linkFallbackEnabled ? "Enabled" : "Hidden"}
                        </p>
                      </div>
                      {featureFlags.linkFallbackEnabled ? (
                        <div className="mt-3 space-y-3">
                          {values.inspirationLinks.map((link, index) => (
                            <div key={`inspiration-link-${index}`} className="flex gap-3">
                              <Input
                                value={link}
                                onChange={(event) =>
                                  setInspirationLink(index, event.target.value)
                                }
                                placeholder="Pinterest board, Instagram post, venue gallery..."
                              />
                              <button
                                type="button"
                                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-charcoal/10 text-charcoal transition hover:border-charcoal/30"
                                onClick={() => removeInspirationLink(index)}
                                aria-label={`Remove inspiration link ${index + 1}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={addInspirationLink}
                          >
                            Add link
                          </Button>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm leading-7 text-charcoal/60">
                          Link fallback is disabled, so image uploads or written notes are the
                          current options.
                        </p>
                      )}
                      <InlineError message={errors.inspirationLinks} />
                    </div>

                    <div>
                      <Label htmlFor="inspiration-text">Written inspiration notes</Label>
                      <Textarea
                        id="inspiration-text"
                        value={values.inspirationText ?? ""}
                        onChange={(event) =>
                          setFieldValue("inspirationText", event.target.value)
                        }
                        placeholder="Share the mood, must-have details, floral direction, venue feel, or anything the images do not explain well."
                        className="min-h-[180px]"
                      />
                      <InlineError message={errors.inspirationText} />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {currentStep === 4 ? (
              <div className="space-y-8">
                <div className="grid gap-4 rounded-[2rem] border border-charcoal/8 bg-cream/60 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                      Contact and review
                    </p>
                    <p className="text-sm leading-7 text-charcoal/68">
                      Add the best contact details, then review the event, items, inspiration, and
                      estimate together before you submit.
                    </p>
                  </div>
                  <PhoneCall className="h-6 w-6 text-charcoal/45" />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <Label htmlFor="customer-name">Your name</Label>
                    <Input
                      id="customer-name"
                      value={values.customerName}
                      onChange={(event) => setFieldValue("customerName", event.target.value)}
                      placeholder="Full name"
                    />
                    <InlineError message={errors.customerName} />
                  </div>
                  <div>
                    <Label htmlFor="customer-email">Email</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={values.customerEmail}
                      onChange={(event) => setFieldValue("customerEmail", event.target.value)}
                      placeholder="name@example.com"
                    />
                    <InlineError message={errors.customerEmail} />
                  </div>
                  <div>
                    <Label htmlFor="customer-phone">Phone</Label>
                    <Input
                      id="customer-phone"
                      value={values.customerPhone}
                      onChange={(event) => setFieldValue("customerPhone", event.target.value)}
                      placeholder="(555) 555-5555"
                    />
                    <InlineError message={errors.customerPhone} />
                  </div>
                  <div>
                    <Label htmlFor="instagram-handle">Instagram handle</Label>
                    <Input
                      id="instagram-handle"
                      value={values.instagramHandle ?? ""}
                      onChange={(event) =>
                        setFieldValue("instagramHandle", event.target.value)
                      }
                      placeholder="@optional"
                    />
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                  <div>
                    <Label>Preferred contact method</Label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(["email", "text", "phone"] as const).map((option) => (
                        <SelectionButton
                          key={option}
                          active={values.preferredContact === option}
                          onClick={() => setFieldValue("preferredContact", option)}
                        >
                          {option === "email"
                            ? "Email"
                            : option === "text"
                              ? "Text"
                              : "Phone"}
                        </SelectionButton>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="how-heard">How did you hear about The Sweet Fork?</Label>
                    <Input
                      id="how-heard"
                      value={values.howDidYouHear ?? ""}
                      onChange={(event) => setFieldValue("howDidYouHear", event.target.value)}
                      placeholder="Instagram, referral, venue, returning client..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="additional-notes">Anything else we should know?</Label>
                  <Textarea
                    id="additional-notes"
                    value={values.additionalNotes ?? ""}
                    onChange={(event) => setFieldValue("additionalNotes", event.target.value)}
                    placeholder="Extra timing notes, venue constraints, setup details, or anything helpful before the first reply."
                    className="min-h-[150px]"
                  />
                </div>

                <div className="rounded-[2rem] border border-charcoal/10 bg-charcoal px-6 py-6 text-ivory">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-gold" />
                    <p className="text-sm font-medium">
                      Final review before submit
                    </p>
                  </div>
                  <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-4">
                      <StatRow
                        label="Event"
                        value={
                          <div>
                            <p>{normalizedValues.eventType}</p>
                            <p className="text-xs uppercase tracking-[0.16em] text-ivory/55">
                              {normalizedValues.eventDate
                                ? formatDate(normalizedValues.eventDate)
                                : "Date pending"}
                            </p>
                          </div>
                        }
                      />
                      <StatRow
                        label="Fulfillment"
                        value={
                          <div>
                            <p className="capitalize">{normalizedValues.fulfillmentMethod}</p>
                            {normalizedValues.deliveryZip ? (
                              <p className="text-xs uppercase tracking-[0.16em] text-ivory/55">
                                ZIP {normalizedValues.deliveryZip}
                              </p>
                            ) : null}
                          </div>
                        }
                      />
                      <StatRow
                        label="Budget"
                        value={
                          <div>
                            <p>{getBudgetRangeLabel(normalizedValues.budgetRange)}</p>
                            <p className="text-xs uppercase tracking-[0.16em] text-ivory/55">
                              {getBudgetFlexibilityLabel(normalizedValues.budgetFlexibility)}
                            </p>
                          </div>
                        }
                      />
                      <StatRow
                        label="Inspiration"
                        value={`${uploads.length} upload${uploads.length === 1 ? "" : "s"}, ${
                          normalizedValues.inspirationLinks.length
                        } link${normalizedValues.inspirationLinks.length === 1 ? "" : "s"}`}
                      />
                    </div>

                    <div className="rounded-[1.8rem] border border-white/12 bg-white/6 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold/70">
                        Included items
                      </p>
                      <div className="mt-4 space-y-3">
                        {selectedItems.map((item) => {
                          const lineItem = estimate.lineItems.find(
                            (entry) => entry.productType === item.productType,
                          );

                          return (
                            <div
                              key={item.productType}
                              className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium text-ivory">
                                    {catalogMap[item.productType]?.name ??
                                      getProductDisplayLabel(item.productType)}
                                  </p>
                                  <p className="mt-1 text-sm text-ivory/65">
                                    {item.productType === "custom-cake"
                                      ? `${item.servings ?? "?"} servings`
                                      : item.productType === "wedding-cake"
                                        ? `${item.weddingServings ?? item.servings ?? "?"} servings`
                                        : item.productType === "cupcakes"
                                          ? `${item.cupcakeCount ?? "?"} cupcakes`
                                          : item.productType === "sugar-cookies"
                                            ? `${item.cookieCount ?? "?"} cookies`
                                            : item.productType === "macarons"
                                              ? `${item.macaronCount ?? "?"} macarons`
                                              : `${item.kitCount ?? "?"} kits`}
                                  </p>
                                </div>
                                <p className="text-sm font-medium text-ivory">
                                  {lineItem
                                    ? `${formatCurrency(lineItem.minimum)} to ${formatCurrency(
                                        lineItem.maximum,
                                      )}`
                                    : "Estimate pending"}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-charcoal/8 bg-cream/50 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-charcoal/60">
                  Progress is kept while you move backward or forward.
                </p>
                {submitError ? (
                  <p className="mt-2 text-sm text-rose-700">{submitError}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 0 || isSubmitting}
                  icon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
                {currentStep < inquiryStepTitles.length - 1 ? (
                  <Button
                    type="button"
                    onClick={goToNextStep}
                    disabled={isSubmitting}
                    icon={<ArrowRight className="h-4 w-4" />}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={submitInquiryForm}
                    disabled={isSubmitting}
                    icon={
                      isSubmitting ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )
                    }
                  >
                    {isSubmitting ? "Submitting inquiry..." : "Submit inquiry"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24">
          <div className="rounded-[2rem] border border-charcoal/10 bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Live estimate
                </p>
                <h3 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-charcoal">
                  {formatCurrency(estimate.minimum)} to {formatCurrency(estimate.maximum)}
                </h3>
              </div>
              <Sparkles className="h-5 w-5 text-charcoal/40" />
            </div>
            <p className="mt-3 text-sm leading-7 text-charcoal/65">
              This first-pass range uses the current pricing baseline plus practical adjustments for
              tiers, finish style, toppers, and delivery.
            </p>
            <div className="mt-6 space-y-3">
              {estimate.lineItems.map((lineItem) => (
                <div
                  key={lineItem.productType}
                  className="rounded-[1.4rem] border border-charcoal/8 bg-cream/55 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-medium text-charcoal">{lineItem.label}</p>
                    <p className="text-sm font-medium text-charcoal">
                      {formatCurrency(lineItem.minimum)} to {formatCurrency(lineItem.maximum)}
                    </p>
                  </div>
                </div>
              ))}
              {estimate.lineItems.length === 0 ? (
                <div className="rounded-[1.4rem] border border-charcoal/8 bg-cream/55 px-4 py-4 text-sm leading-7 text-charcoal/62">
                  Select at least one product to start the working estimate.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-charcoal/10 bg-white p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
              Inquiry snapshot
            </p>
            <div className="mt-4 space-y-1">
              <StatRow
                label="Selected items"
                value={`${selectedItems.length} selection${selectedItems.length === 1 ? "" : "s"}`}
              />
              <StatRow
                label="Event date"
                value={
                  normalizedValues.eventDate
                    ? formatDate(normalizedValues.eventDate)
                    : "Not set yet"
                }
              />
              <StatRow
                label="Fulfillment"
                value={
                  normalizedValues.fulfillmentMethod === "delivery" ? (
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Delivery
                    </span>
                  ) : (
                    "Pickup"
                  )
                }
              />
              <StatRow
                label="Budget"
                value={getBudgetRangeLabel(normalizedValues.budgetRange)}
              />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
