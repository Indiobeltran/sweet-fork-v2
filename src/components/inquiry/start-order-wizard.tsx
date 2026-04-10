"use client";

import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
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
import { cn, formatDate } from "@/lib/utils";
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
import { getProductDisplayLabel } from "@/lib/pricing";
import type {
  InquiryCatalogItem,
  InquirySubmissionResponse,
} from "@/lib/inquiries/types";
import {
  createEmptyInquiryValues,
  getMinimumInquiryDate,
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

type StartOrderWizardProps = {
  catalog: InquiryCatalogItem[];
  featureFlags: InquiryFeatureFlags;
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
    <div
      role="listitem"
      aria-current={active ? "step" : undefined}
      aria-label={`Step ${index + 1}: ${title}${complete ? ", complete" : active ? ", current" : ""}`}
      className={cn(
        "flex items-center gap-2 rounded-full transition sm:min-w-0 sm:gap-3",
        active ? "border border-charcoal bg-charcoal px-3 py-2 text-ivory shadow-soft" : "px-0 py-0",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition",
          complete
            ? "border-charcoal bg-charcoal text-ivory"
            : active
              ? "border-ivory/30 bg-ivory text-charcoal"
              : "border-charcoal/10 bg-white text-charcoal/40",
        )}
      >
        {complete ? <Check className="h-4 w-4" /> : index + 1}
      </div>
      <div className={cn("min-w-0", active ? "block" : "hidden sm:block")}>
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
    </div>
  );
}

function InlineError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p role="alert" className="mt-2 text-sm text-rose-700">
      {message}
    </p>
  );
}

function StepAlert({ message }: { message?: string }) {
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

function FieldLabel({
  children,
  required = false,
  ...props
}: ComponentProps<typeof Label> & { required?: boolean }) {
  return (
    <Label {...props}>
      <span>{children}</span>
      {required ? <span className="ml-2 text-[10px] text-charcoal/52">Required</span> : null}
    </Label>
  );
}

function SelectionButton({
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
        "rounded-full border px-4 py-2 text-left text-sm transition",
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

function StatRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-charcoal/8 py-3 last:border-none last:pb-0">
      <p className="text-sm text-charcoal/55">{label}</p>
      <div className="text-right text-sm font-medium text-charcoal">{value}</div>
    </div>
  );
}

function getFieldErrorClass(...messages: Array<string | undefined>) {
  return messages.some(Boolean)
    ? "border-rose-300 bg-rose-50/70 focus:border-rose-400 focus:ring-rose-100"
    : undefined;
}

function formatSelectedItemSummary(item: InquiryProductItem) {
  switch (item.productType) {
    case "custom-cake":
      return `${item.servings ?? "?"} servings`;
    case "wedding-cake":
      return `${item.weddingServings ?? item.servings ?? "?"} servings`;
    case "cupcakes":
      return `${item.cupcakeCount ?? "?"} cupcakes`;
    case "sugar-cookies":
      return `${item.cookieCount ?? "?"} cookies`;
    case "macarons":
      return `${item.macaronCount ?? "?"} macarons`;
    case "diy-kit":
      return `${item.kitCount ?? "?"} kits`;
    default:
      return `${item.quantity} item${item.quantity === 1 ? "" : "s"}`;
  }
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
}: StartOrderWizardProps) {
  const [startedAt] = useState(() => Date.now());
  const [currentStep, setCurrentStep] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [activeItemType, setActiveItemType] = useState<ProductType | null>(null);
  const [values, setValues] = useState<InquiryFormValues>(() => createEmptyInquiryValues());
  const [uploads, setUploads] = useState<UploadDraft[]>([]);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [honeypotValue, setHoneypotValue] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<InquirySubmissionResponse | null>(
    null,
  );
  const stepViewportRef = useRef<HTMLDivElement | null>(null);
  const hasMountedRef = useRef(false);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const shouldFocusErrorRef = useRef(false);

  const normalizedValues = normalizeInquiryFormValues(values);
  const minimumEventDate = getMinimumInquiryDate();
  const progressPercentage = Math.round(
    ((currentStep + 1) / inquiryStepTitles.length) * 100,
  );
  const selectedItems = normalizedValues.orderItems;
  const catalogMap = catalog.reduce(
    (accumulator, item) => {
      accumulator[item.productType] = item;
      return accumulator;
    },
    {} as Record<ProductType, InquiryCatalogItem>,
  );

  useEffect(() => {
    if (selectedItems.length === 0) {
      setActiveItemType(null);
      return;
    }

    if (!activeItemType || !selectedItems.some((item) => item.productType === activeItemType)) {
      setActiveItemType(selectedItems[0].productType);
    }
  }, [activeItemType, selectedItems]);

  useEffect(() => {
    if (currentStep > 0) {
      setHasStarted(true);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const target = stepViewportRef.current;

      if (!target) {
        return;
      }

      const offset = window.matchMedia("(min-width: 1024px)").matches ? 104 : 88;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({
        top: Math.max(top, 0),
        behavior: "smooth",
      });
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [currentStep]);

  useEffect(() => {
    if (!shouldFocusErrorRef.current || Object.keys(errors).length === 0) {
      return;
    }

    shouldFocusErrorRef.current = false;
    const keys = Object.keys(errors);
    const firstKey = keys[0];
    const target = fieldRefs.current[firstKey];

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      if ("focus" in target) {
        window.setTimeout(() => {
          (target as HTMLElement).focus();
        }, 160);
      }
    }
  }, [currentStep, errors]);

  const activeItem =
    selectedItems.find((item) => item.productType === activeItemType) ?? selectedItems[0];

  const stepHasError = Object.keys(errors).some((key) => findStepForErrors({ [key]: errors[key] }) === currentStep);
  const registerFieldRef =
    (key: string) =>
    (element: HTMLElement | null) => {
      fieldRefs.current[key] = element;
    };

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
      shouldFocusErrorRef.current = true;
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
      shouldFocusErrorRef.current = true;
      setErrors(nextErrors);
      setCurrentStep(findStepForErrors(nextErrors));
      return;
    }

    if (!featureFlags.linkFallbackEnabled && preparedValues.inspirationLinks.length > 0) {
      shouldFocusErrorRef.current = true;
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
      formData.append("startedAt", String(startedAt));
      formData.append("website", honeypotValue);

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
                Your request was received under{" "}
                <span className="font-semibold text-charcoal">
                  {submissionResult.referenceCode}
                </span>
                . The Sweet Fork can now review the event scope, design direction, and timing
                before sending the next reply.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.8rem] border border-charcoal/8 bg-cream/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Event date
                </p>
                <p className="mt-3 text-lg font-medium text-charcoal">
                  {normalizedValues.eventDate
                    ? formatDate(normalizedValues.eventDate)
                    : "To be confirmed"}
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
                  The order details, selected desserts, and inspiration references are reviewed
                  together.
                </p>
              </div>
              <div>
                <p className="font-medium">2. Quote</p>
                <p className="mt-1 text-sm leading-7 text-ivory/70">
                  A quote and next-step details are prepared around the design, servings, timing,
                  and delivery needs.
                </p>
              </div>
              <div>
                <p className="font-medium">3. Reserve</p>
                <p className="mt-1 text-sm leading-7 text-ivory/70">
                  Once the quote is approved, a deposit secures the order date.
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
    <section className="section-shell pb-20" data-order-wizard-state={hasStarted ? "started" : "intro"}>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="grain-surface overflow-hidden rounded-[2.4rem] border border-charcoal/10 bg-white shadow-soft">
          <div
            className={cn(
              "border-b border-charcoal/8 px-5 py-5 transition-[padding,background-color] duration-300 sm:px-8",
              hasStarted ? "bg-white/92" : "bg-cream/70 sm:py-6",
            )}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge>Inquiry</Badge>
                <p className="text-sm text-charcoal/60">
                  {hasStarted
                    ? "Stay with the active step. You can move backward without losing progress."
                    : "One guided inquiry for the full order."}
                </p>
              </div>

              <div
                className={cn(
                  "grid gap-4 transition-[grid-template-columns] duration-300 lg:items-end",
                  hasStarted ? "lg:grid-cols-[1fr_240px]" : "lg:grid-cols-[1.15fr_0.85fr]",
                )}
              >
                <div
                  className={cn(
                    "overflow-hidden transition-[max-height,opacity,transform] duration-300",
                    hasStarted ? "max-h-0 translate-y-[-8px] opacity-0" : "max-h-60 opacity-100",
                  )}
                >
                  <h2 className="font-serif text-4xl tracking-[-0.04em] text-charcoal sm:text-5xl">
                    Share the celebration details Sweet Fork needs for a tailored quote.
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-8 text-charcoal/70">
                    Add the event details, dessert selections, inspiration, and contact preferences
                    in one place. Each step keeps the details focused so the inquiry never feels
                    overwhelming on mobile.
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-[1.8rem] border px-4 py-4 transition-colors duration-300 sm:px-5 sm:py-5",
                    hasStarted ? "border-charcoal/10 bg-cream/65" : "border-charcoal/8 bg-white",
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                    Current step
                  </p>
                  <p
                    className={cn(
                      "font-serif tracking-[-0.04em] text-charcoal",
                      hasStarted ? "mt-2 text-[1.9rem] leading-none sm:text-3xl" : "mt-3 text-3xl",
                    )}
                  >
                    {inquiryStepTitles[currentStep]}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-charcoal/65">
                    {currentStep + 1} of {inquiryStepTitles.length}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-charcoal/45">
                  <span>Progress</span>
                  <span>{progressPercentage}% complete</span>
                </div>
                <div
                  aria-label="Inquiry progress"
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={progressPercentage}
                  role="progressbar"
                  className="h-2 overflow-hidden rounded-full bg-charcoal/8"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold to-charcoal"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-sm text-charcoal/58">
                  Fields marked <span className="font-medium text-charcoal">Required</span> are needed for a tailored quote.
                </p>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 sm:gap-3" role="list" aria-label="Inquiry steps">
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

          <div className="px-5 py-6 sm:px-8 sm:py-10">
            <div ref={stepViewportRef} className="scroll-mt-24 sm:scroll-mt-28" />
            <StepAlert
              message={stepHasError ? "Please review the highlighted fields before continuing." : undefined}
            />
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="website">Leave this field empty</label>
              <input
                id="website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypotValue}
                onChange={(event) => setHoneypotValue(event.target.value)}
              />
            </div>
            {currentStep === 0 ? (
              <div className="space-y-6 sm:space-y-8">
                <div className="grid gap-3 rounded-[2rem] border border-charcoal/8 bg-cream/60 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
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
                  <FieldLabel htmlFor="event-type" required>
                    What are you celebrating?
                  </FieldLabel>
                  <Input
                    id="event-type"
                    ref={registerFieldRef("eventType")}
                    value={values.eventType}
                    onChange={(event) => setFieldValue("eventType", event.target.value)}
                    placeholder="Birthday, wedding, shower, launch, holiday gathering..."
                    className={getFieldErrorClass(errors.eventType)}
                    required
                    aria-invalid={Boolean(errors.eventType)}
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
                    <FieldLabel htmlFor="event-date" required>
                      Event date
                    </FieldLabel>
                    <Input
                      id="event-date"
                      ref={registerFieldRef("eventDate")}
                      type="date"
                      value={values.eventDate}
                      onChange={(event) => setFieldValue("eventDate", event.target.value)}
                      onFocus={(event) => {
                        event.currentTarget.showPicker?.();
                      }}
                      min={minimumEventDate}
                      className={getFieldErrorClass(errors.eventDate)}
                      required
                      aria-describedby="event-date-hint"
                      aria-invalid={Boolean(errors.eventDate)}
                    />
                    <p id="event-date-hint" className="mt-2 text-sm text-charcoal/58">
                      Online inquiries accept future dates only and review them in Mountain Time.
                    </p>
                    <InlineError message={errors.eventDate} />
                  </div>
                  <div>
                    <Label htmlFor="guest-count">Guest count</Label>
                    <Input
                      id="guest-count"
                      ref={registerFieldRef("guestCount")}
                      inputMode="numeric"
                      value={values.guestCount ?? ""}
                      onChange={(event) => setNumericValue("guestCount", event.target.value)}
                      placeholder="Approximate number of guests"
                      className={getFieldErrorClass(errors.guestCount)}
                    />
                    <InlineError message={errors.guestCount} />
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                  <div className="space-y-3">
                    <FieldLabel required>Fulfillment type</FieldLabel>
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
                      ref={registerFieldRef("deliveryZip")}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      value={values.deliveryZip ?? ""}
                      onChange={(event) => setFieldValue("deliveryZip", event.target.value)}
                      placeholder={
                        values.fulfillmentMethod === "delivery"
                          ? "Required for delivery requests"
                          : "Only needed if delivery is selected"
                      }
                      pattern="\\d{5}(?:-\\d{4})?"
                      maxLength={10}
                      className={getFieldErrorClass(errors.deliveryZip)}
                      aria-invalid={Boolean(errors.deliveryZip)}
                    />
                    <InlineError message={errors.deliveryZip} />
                  </div>
                </div>

                <div>
                  <FieldLabel required>Investment comfort range</FieldLabel>
                  <div className="grid gap-3 md:grid-cols-2">
                    {budgetRangeOptions.map((option, index) => (
                      <button
                        key={option.value}
                        type="button"
                        ref={index === 0 ? registerFieldRef("budgetRange") : undefined}
                        aria-pressed={values.budgetRange === option.value}
                        className={cn(
                          "rounded-[1.6rem] border p-4 text-left transition",
                          values.budgetRange === option.value
                            ? "border-charcoal bg-charcoal text-ivory"
                            : "border-charcoal/10 bg-white hover:border-charcoal/30",
                          errors.budgetRange && "border-rose-300 bg-rose-50/70",
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
                  <FieldLabel required>Budget flexibility</FieldLabel>
                  <div className="grid gap-3 md:grid-cols-3">
                    {budgetFlexibilityOptions.map((option, index) => (
                      <button
                        key={option.value}
                        type="button"
                        ref={index === 0 ? registerFieldRef("budgetFlexibility") : undefined}
                        aria-pressed={values.budgetFlexibility === option.value}
                        className={cn(
                          "rounded-[1.6rem] border p-4 text-left transition",
                          values.budgetFlexibility === option.value
                            ? "border-charcoal bg-charcoal text-ivory"
                            : "border-charcoal/10 bg-white hover:border-charcoal/30",
                          errors.budgetFlexibility && "border-rose-300 bg-rose-50/70",
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
              <div className="space-y-6 sm:space-y-8">
                <div className="grid gap-3 rounded-[2rem] border border-charcoal/8 bg-cream/60 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                      Product mix
                    </p>
                    <p className="text-sm leading-7 text-charcoal/68">
                      Select every sweet you want Sweet Fork to consider for this event. One
                      inquiry can cover the full dessert story.
                    </p>
                  </div>
                  <PartyPopper className="h-6 w-6 text-charcoal/45" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {catalog.map((product, index) => {
                    const selected = selectedItems.some(
                      (item) => item.productType === product.productType,
                    );

                    return (
                      <button
                        key={product.productType}
                        type="button"
                        ref={index === 0 ? registerFieldRef("orderItems") : undefined}
                        aria-pressed={selected}
                        className={cn(
                          "rounded-[1.9rem] border p-4 text-left transition sm:p-5",
                          selected
                            ? "border-charcoal bg-charcoal text-ivory"
                            : "border-charcoal/10 bg-white hover:border-charcoal/30",
                          errors.orderItems && "border-rose-300 bg-rose-50/70 text-charcoal",
                        )}
                        onClick={() => toggleProductSelection(product.productType)}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-serif text-[1.7rem] tracking-[-0.04em] sm:text-3xl">
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
                          <p
                            className={cn(
                              "text-sm font-medium",
                              selected ? "text-ivory" : "text-charcoal/70",
                            )}
                          >
                            {selected ? "Included in your inquiry" : "Add to inquiry"}
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
              <div className="space-y-6 sm:space-y-8">
                <div className="grid gap-3 rounded-[2rem] border border-charcoal/8 bg-cream/60 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                      Item details
                    </p>
                    <p className="text-sm leading-7 text-charcoal/68">
                      Each selected product gets its own detail panel so the quote can reflect
                      counts, servings, finish preferences, and design direction cleanly.
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
                  <div className="space-y-6 rounded-[2rem] border border-charcoal/10 bg-white p-5 shadow-soft sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                          Active selection
                        </p>
                        <h3 className="mt-2 font-serif text-[2rem] tracking-[-0.04em] text-charcoal sm:text-4xl">
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
                            ref={(element) => {
                              registerFieldRef(itemPath(activeItem.productType, "servings"))(element);
                              if (activeItem.productType === "wedding-cake") {
                                registerFieldRef(itemPath(activeItem.productType, "weddingServings"))(element);
                              }
                            }}
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
                            className={getFieldErrorClass(
                              errors[itemPath(activeItem.productType, "servings")],
                              errors[itemPath(activeItem.productType, "weddingServings")],
                            )}
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
                            ref={registerFieldRef(itemPath(activeItem.productType, "tiers"))}
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
                            className={getFieldErrorClass(errors[itemPath(activeItem.productType, "tiers")])}
                          />
                          <InlineError
                            message={errors[itemPath(activeItem.productType, "tiers")]}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${activeItem.productType}-shape`}>Shape</Label>
                          <Select
                            id={`${activeItem.productType}-shape`}
                            ref={registerFieldRef(itemPath(activeItem.productType, "shape"))}
                            value={activeItem.shape ?? ""}
                            onChange={(event) =>
                              updateOrderItem(activeItem.productType, {
                                shape:
                                  event.target.value === ""
                                    ? undefined
                                    : (event.target.value as InquiryProductItem["shape"]),
                              })
                            }
                            className={getFieldErrorClass(errors[itemPath(activeItem.productType, "shape")])}
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
                            ref={registerFieldRef(itemPath(activeItem.productType, "icingStyle"))}
                            value={activeItem.icingStyle ?? ""}
                            onChange={(event) =>
                              updateOrderItem(activeItem.productType, {
                                icingStyle:
                                  event.target.value === ""
                                    ? undefined
                                    : (event.target.value as InquiryProductItem["icingStyle"]),
                              })
                            }
                            className={getFieldErrorClass(errors[itemPath(activeItem.productType, "icingStyle")])}
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
                          ref={registerFieldRef(itemPath(activeItem.productType, "cupcakeCount"))}
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
                          placeholder="24 or 48"
                          className={getFieldErrorClass(errors[itemPath(activeItem.productType, "cupcakeCount")])}
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
                          ref={registerFieldRef(itemPath(activeItem.productType, "cookieCount"))}
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
                          placeholder="24 or 48"
                          className={getFieldErrorClass(errors[itemPath(activeItem.productType, "cookieCount")])}
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
                          ref={registerFieldRef(itemPath(activeItem.productType, "macaronCount"))}
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
                          placeholder="24 or 48"
                          className={getFieldErrorClass(errors[itemPath(activeItem.productType, "macaronCount")])}
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
                          ref={registerFieldRef(itemPath(activeItem.productType, "kitCount"))}
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
                          className={getFieldErrorClass(errors[itemPath(activeItem.productType, "kitCount")])}
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
                          ref={registerFieldRef(itemPath(activeItem.productType, "colorPalette"))}
                          value={activeItem.colorPalette ?? ""}
                          onChange={(event) =>
                            updateOrderItem(activeItem.productType, {
                              colorPalette: event.target.value,
                            })
                          }
                          placeholder="Ivory, sage, soft gold, blush..."
                          className={getFieldErrorClass(errors[itemPath(activeItem.productType, "colorPalette")])}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${activeItem.productType}-topper`}>Topper or wording</Label>
                        <Input
                          id={`${activeItem.productType}-topper`}
                          ref={registerFieldRef(itemPath(activeItem.productType, "topperText"))}
                          value={activeItem.topperText ?? ""}
                          onChange={(event) =>
                            updateOrderItem(activeItem.productType, {
                              topperText: event.target.value,
                            })
                          }
                          placeholder="Optional wording or topper notes"
                          className={getFieldErrorClass(errors[itemPath(activeItem.productType, "topperText")])}
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div>
                        <Label htmlFor={`${activeItem.productType}-flavor`}>Flavor notes</Label>
                        <Textarea
                          id={`${activeItem.productType}-flavor`}
                          ref={registerFieldRef(itemPath(activeItem.productType, "flavorNotes"))}
                          value={activeItem.flavorNotes ?? ""}
                          onChange={(event) =>
                            updateOrderItem(activeItem.productType, {
                              flavorNotes: event.target.value,
                            })
                          }
                          placeholder="Favorite flavors, fillings, or ingredients to highlight"
                          className={cn(
                            "min-h-[120px]",
                            getFieldErrorClass(errors[itemPath(activeItem.productType, "flavorNotes")]),
                          )}
                          aria-invalid={Boolean(errors[itemPath(activeItem.productType, "flavorNotes")])}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${activeItem.productType}-design`}>Design notes</Label>
                        <Textarea
                          id={`${activeItem.productType}-design`}
                          ref={registerFieldRef(itemPath(activeItem.productType, "designNotes"))}
                          value={activeItem.designNotes ?? ""}
                          onChange={(event) =>
                            updateOrderItem(activeItem.productType, {
                              designNotes: event.target.value,
                            })
                          }
                          placeholder="Overall direction, motifs, florals, finish, packaging, or styling cues"
                          className={cn(
                            "min-h-[120px]",
                            getFieldErrorClass(errors[itemPath(activeItem.productType, "designNotes")]),
                          )}
                          aria-invalid={Boolean(errors[itemPath(activeItem.productType, "designNotes")])}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`${activeItem.productType}-inspiration`}>
                        Item-specific inspiration notes
                      </Label>
                      <Textarea
                        id={`${activeItem.productType}-inspiration`}
                        ref={registerFieldRef(itemPath(activeItem.productType, "inspirationNotes"))}
                        value={activeItem.inspirationNotes ?? ""}
                        onChange={(event) =>
                          updateOrderItem(activeItem.productType, {
                            inspirationNotes: event.target.value,
                          })
                        }
                        placeholder="Anything about this item that should stand out in the proposal"
                        className={cn(
                          "min-h-[120px]",
                          getFieldErrorClass(errors[itemPath(activeItem.productType, "inspirationNotes")]),
                        )}
                        aria-invalid={Boolean(errors[itemPath(activeItem.productType, "inspirationNotes")])}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="space-y-6 sm:space-y-8">
                <div className="grid gap-3 rounded-[2rem] border border-charcoal/8 bg-cream/60 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                      Inspiration
                    </p>
                    <p className="text-sm leading-7 text-charcoal/68">
                      Upload direct references when you have them, then add links or written notes
                      if they tell the story better.
                    </p>
                  </div>
                  <ImagePlus className="h-6 w-6 text-charcoal/45" />
                </div>

                <div>
                  <Label htmlFor="overall-palette">Overall palette or mood</Label>
                  <Input
                    id="overall-palette"
                    ref={registerFieldRef("colorPalette")}
                    value={values.colorPalette ?? ""}
                    onChange={(event) => setFieldValue("colorPalette", event.target.value)}
                    placeholder="Romantic neutrals, polished black and ivory, cheerful pastels..."
                    className={getFieldErrorClass(errors.colorPalette)}
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
                      ref={registerFieldRef("inspirationUploads")}
                      tabIndex={-1}
                      className={cn(
                        "flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed px-5 py-7 text-center transition sm:min-h-[220px] sm:px-6 sm:py-8",
                        featureFlags.uploadsEnabled
                          ? "border-charcoal/18 bg-cream/45 hover:border-charcoal/35"
                          : "cursor-not-allowed border-charcoal/10 bg-charcoal/3 text-charcoal/40",
                        errors.inspirationUploads && "border-rose-300 bg-rose-50/70",
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
                                ref={index === 0 ? registerFieldRef("inspirationLinks") : undefined}
                                value={link}
                                onChange={(event) =>
                                  setInspirationLink(index, event.target.value)
                                }
                                placeholder="Pinterest board, Instagram post, venue gallery..."
                                className={getFieldErrorClass(errors.inspirationLinks)}
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
                        ref={registerFieldRef("inspirationText")}
                        value={values.inspirationText ?? ""}
                        onChange={(event) =>
                          setFieldValue("inspirationText", event.target.value)
                        }
                        placeholder="Share the mood, must-have details, floral direction, venue feel, or anything the images do not explain well."
                        className={cn(
                          "min-h-[180px]",
                          getFieldErrorClass(errors.inspirationText),
                        )}
                      />
                      <InlineError message={errors.inspirationText} />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {currentStep === 4 ? (
              <div className="space-y-6 sm:space-y-8">
                <div className="grid gap-3 rounded-[2rem] border border-charcoal/8 bg-cream/60 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                      Review and submit
                    </p>
                    <p className="text-sm leading-7 text-charcoal/68">
                      Add the best contact details, then review the event, product, inspiration,
                      and contact sections before you submit.
                    </p>
                  </div>
                  <PhoneCall className="h-6 w-6 text-charcoal/45" />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="customer-name" required>
                      Your name
                    </FieldLabel>
                    <Input
                      id="customer-name"
                      ref={registerFieldRef("customerName")}
                      value={values.customerName}
                      onChange={(event) => setFieldValue("customerName", event.target.value)}
                      placeholder="Full name"
                      className={getFieldErrorClass(errors.customerName)}
                      autoComplete="name"
                      required
                      aria-invalid={Boolean(errors.customerName)}
                    />
                    <InlineError message={errors.customerName} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="customer-email" required>
                      Email
                    </FieldLabel>
                    <Input
                      id="customer-email"
                      ref={registerFieldRef("customerEmail")}
                      type="email"
                      value={values.customerEmail}
                      onChange={(event) => setFieldValue("customerEmail", event.target.value)}
                      placeholder="hello@yourmail.com"
                      className={getFieldErrorClass(errors.customerEmail)}
                      autoComplete="email"
                      required
                      aria-invalid={Boolean(errors.customerEmail)}
                    />
                    <InlineError message={errors.customerEmail} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="customer-phone" required>
                      Phone
                    </FieldLabel>
                    <Input
                      id="customer-phone"
                      ref={registerFieldRef("customerPhone")}
                      type="tel"
                      value={values.customerPhone}
                      onChange={(event) => setFieldValue("customerPhone", event.target.value)}
                      placeholder="(555) 555-5555"
                      className={getFieldErrorClass(errors.customerPhone)}
                      autoComplete="tel"
                      inputMode="tel"
                      required
                      aria-invalid={Boolean(errors.customerPhone)}
                    />
                    <InlineError message={errors.customerPhone} />
                  </div>
                  <div>
                    <Label htmlFor="instagram-handle">Instagram handle</Label>
                    <Input
                      id="instagram-handle"
                      ref={registerFieldRef("instagramHandle")}
                      value={values.instagramHandle ?? ""}
                      onChange={(event) =>
                        setFieldValue("instagramHandle", event.target.value)
                      }
                      placeholder="@optional"
                      className={getFieldErrorClass(errors.instagramHandle)}
                    />
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                  <div>
                    <FieldLabel required>Preferred contact method</FieldLabel>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(["email", "text", "phone"] as const).map((option, index) => (
                        <SelectionButton
                          key={option}
                          active={values.preferredContact === option}
                          buttonRef={index === 0 ? registerFieldRef("preferredContact") : undefined}
                          className={cn(
                            errors.preferredContact && "border-rose-300 bg-rose-50/70 text-charcoal",
                          )}
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
                    <InlineError message={errors.preferredContact} />
                  </div>
                  <div>
                    <Label htmlFor="how-heard">How did you hear about The Sweet Fork?</Label>
                    <Input
                      id="how-heard"
                      ref={registerFieldRef("howDidYouHear")}
                      value={values.howDidYouHear ?? ""}
                      onChange={(event) => setFieldValue("howDidYouHear", event.target.value)}
                      placeholder="Instagram, referral, venue, returning client..."
                      className={getFieldErrorClass(errors.howDidYouHear)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="additional-notes">Anything else we should know?</Label>
                  <Textarea
                    id="additional-notes"
                    ref={registerFieldRef("additionalNotes")}
                    value={values.additionalNotes ?? ""}
                    onChange={(event) => setFieldValue("additionalNotes", event.target.value)}
                    placeholder="Extra timing notes, venue constraints, setup details, or anything helpful before the first reply."
                    className={cn(
                      "min-h-[150px]",
                      getFieldErrorClass(errors.additionalNotes),
                    )}
                  />
                </div>

                <div className="rounded-[2rem] border border-charcoal/10 bg-charcoal px-5 py-5 text-ivory sm:px-6 sm:py-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-gold" />
                    <p className="text-sm font-medium">Final review before submit</p>
                  </div>
                  <div className="mt-6 grid gap-4">
                    <div className="rounded-[1.6rem] border border-white/12 bg-white/6 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-ivory">Event details</p>
                        <button
                          type="button"
                          className="rounded-full border border-white/12 px-3 py-1 text-xs uppercase tracking-[0.16em] text-ivory/78 transition hover:border-white/24"
                          onClick={() => setCurrentStep(0)}
                        >
                          Edit
                        </button>
                      </div>
                      <div className="mt-4 space-y-3 text-sm leading-7 text-ivory/72">
                        <p>{normalizedValues.eventType}</p>
                        <p>{normalizedValues.eventDate ? formatDate(normalizedValues.eventDate) : "Date pending"}</p>
                        <p className="capitalize">
                          {normalizedValues.fulfillmentMethod}
                          {normalizedValues.deliveryZip ? ` • ZIP ${normalizedValues.deliveryZip}` : ""}
                        </p>
                        <p>
                          {getBudgetRangeLabel(normalizedValues.budgetRange)}
                          {" • "}
                          {getBudgetFlexibilityLabel(normalizedValues.budgetFlexibility)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[1.6rem] border border-white/12 bg-white/6 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-ivory">Product selections</p>
                        <button
                          type="button"
                          className="rounded-full border border-white/12 px-3 py-1 text-xs uppercase tracking-[0.16em] text-ivory/78 transition hover:border-white/24"
                          onClick={() => setCurrentStep(2)}
                        >
                          Edit
                        </button>
                      </div>
                      <div className="mt-4 space-y-3">
                        {selectedItems.map((item) => (
                          <div
                            key={item.productType}
                            className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-4 text-sm text-ivory/72"
                          >
                            <p className="font-medium text-ivory">
                              {catalogMap[item.productType]?.name ?? getProductDisplayLabel(item.productType)}
                            </p>
                            <p className="mt-1">{formatSelectedItemSummary(item)}</p>
                            {item.designNotes ? (
                              <p className="mt-2 text-ivory/56">Design: {item.designNotes}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.6rem] border border-white/12 bg-white/6 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-ivory">Design inputs</p>
                        <button
                          type="button"
                          className="rounded-full border border-white/12 px-3 py-1 text-xs uppercase tracking-[0.16em] text-ivory/78 transition hover:border-white/24"
                          onClick={() => setCurrentStep(3)}
                        >
                          Edit
                        </button>
                      </div>
                      <div className="mt-4 space-y-3 text-sm leading-7 text-ivory/72">
                        <p>Overall palette: {normalizedValues.colorPalette ?? "Not shared yet"}</p>
                        <p>
                          Inspiration files: {uploads.length} upload{uploads.length === 1 ? "" : "s"}
                        </p>
                        <p>
                          Inspiration links: {normalizedValues.inspirationLinks.length} link
                          {normalizedValues.inspirationLinks.length === 1 ? "" : "s"}
                        </p>
                        <p>{normalizedValues.inspirationText ?? "No additional written inspiration notes yet."}</p>
                      </div>
                    </div>

                    <div className="rounded-[1.6rem] border border-white/12 bg-white/6 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-ivory">Contact info</p>
                        <button
                          type="button"
                          className="rounded-full border border-white/12 px-3 py-1 text-xs uppercase tracking-[0.16em] text-ivory/78 transition hover:border-white/24"
                          onClick={() => setCurrentStep(4)}
                        >
                          Edit
                        </button>
                      </div>
                      <div className="mt-4 space-y-3 text-sm leading-7 text-ivory/72">
                        <p>{normalizedValues.customerName}</p>
                        <p>{normalizedValues.customerEmail}</p>
                        <p>{normalizedValues.customerPhone}</p>
                        <p>
                          Preferred contact:{" "}
                          {normalizedValues.preferredContact === "email"
                            ? "Email"
                            : normalizedValues.preferredContact === "text"
                              ? "Text"
                              : "Phone"}
                        </p>
                        {normalizedValues.instagramHandle ? <p>{normalizedValues.instagramHandle}</p> : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-charcoal/8 bg-cream/50 px-5 py-5 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-charcoal/60">
                  Your progress stays in place while you move backward or forward.
                </p>
                {submitError ? (
                  <p role="alert" className="mt-2 text-sm text-rose-700">
                    {submitError}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 0 || isSubmitting}
                  icon={<ArrowLeft className="h-4 w-4" />}
                  className="w-full sm:w-auto"
                >
                  Back
                </Button>
                {currentStep < inquiryStepTitles.length - 1 ? (
                  <Button
                    type="button"
                    onClick={goToNextStep}
                    disabled={isSubmitting}
                    icon={<ArrowRight className="h-4 w-4" />}
                    className="w-full sm:w-auto"
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
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? "Submitting inquiry..." : "Submit inquiry"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24">
          <div className="rounded-[2rem] border border-charcoal/10 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  What happens next
                </p>
                <h3 className="mt-3 font-serif text-[2rem] tracking-[-0.04em] text-charcoal sm:text-4xl">
                  Thoughtful review, then a tailored quote.
                </h3>
              </div>
              <Sparkles className="h-5 w-5 text-charcoal/40" />
            </div>
            <div className="mt-5 space-y-3 text-sm leading-7 text-charcoal/66">
              <p>1. Sweet Fork reviews the event details, selected desserts, and inspiration.</p>
              <p>2. A quote and next-step details are usually sent within 24 to 48 hours.</p>
              <p>3. If everything looks right, a deposit secures the date on the calendar.</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-charcoal/10 bg-white p-5 shadow-soft sm:p-6">
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
                value={normalizedValues.fulfillmentMethod === "delivery" ? "Delivery" : "Pickup"}
              />
              <StatRow
                label="Investment"
                value={getBudgetRangeLabel(normalizedValues.budgetRange)}
              />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
