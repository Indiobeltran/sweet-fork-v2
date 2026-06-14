"use client";

import {
  type MouseEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
  inquiryStepDescriptions,
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
  type InquiryFormValues,
} from "@/lib/validations/inquiry";
import type { InquiryProductItem, ProductType } from "@/types/domain";
import {
  findStepForErrors,
  flattenIssues,
  formatSelectedItemSummary,
  getDescribedBy,
  getErrorDescriptionId,
  getFieldErrorClass,
  getSafeSubmissionErrorMessage,
  getStepErrorMessage,
  isErrorForStep,
  type ErrorMap,
} from "@/components/inquiry/wizard-helpers";
import {
  FieldLabel,
  InlineError,
  SelectionButton,
  StatRow,
  StepAlert,
  StepMarker,
} from "@/components/inquiry/wizard-ui";

type StartOrderWizardProps = {
  catalog: InquiryCatalogItem[];
  catalogSource: "live" | "fallback";
  featureFlags: InquiryFeatureFlags;
  submissionAvailable: boolean;
  submissionUnavailableMessage?: string;
};

export function StartOrderWizard({
  catalog,
  catalogSource,
  featureFlags,
  submissionAvailable,
  submissionUnavailableMessage,
}: StartOrderWizardProps) {
  const [startedAt] = useState(() => Date.now());
  const [currentStep, setCurrentStep] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [activeItemType, setActiveItemType] = useState<ProductType | null>(null);
  const [values, setValues] = useState<InquiryFormValues>(() => createEmptyInquiryValues());
  const [errors, setErrors] = useState<ErrorMap>({});
  const [honeypotValue, setHoneypotValue] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<InquirySubmissionResponse | null>(
    null,
  );
  const successTopRef = useRef<HTMLElement | null>(null);
  const wizardTopRef = useRef<HTMLElement | null>(null);
  const stepViewportRef = useRef<HTMLDivElement | null>(null);
  const stepMarkerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);
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

    stepMarkerRefs.current[currentStep]?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });

    const timeoutId = window.setTimeout(() => {
      const target = wizardTopRef.current ?? stepViewportRef.current;
      const shouldFocusHeading = !shouldFocusErrorRef.current;

      if (!target) {
        return;
      }

      const offset = window.matchMedia("(min-width: 1024px)").matches ? 24 : 12;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({
        top: Math.max(top, 0),
        behavior: "smooth",
      });

      if (shouldFocusHeading) {
        window.setTimeout(() => {
          stepHeadingRef.current?.focus();
        }, 160);
      }
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

  useLayoutEffect(() => {
    if (!submissionResult || !successTopRef.current) {
      return;
    }

    const offset = window.matchMedia("(min-width: 1024px)").matches ? 24 : 12;
    const top = successTopRef.current.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top: Math.max(top, 0),
      behavior: "auto",
    });
  }, [submissionResult]);

  const activeItem =
    selectedItems.find((item) => item.productType === activeItemType) ?? selectedItems[0];

  const stepHasError = Object.keys(errors).some((key) => isErrorForStep(key, currentStep));
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

  const validateStep = (
    stepIndex: number,
    nextValues = values,
    options: { focusOnError?: boolean } = {},
  ) => {
    const { focusOnError = true } = options;
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

    setErrors((current) => {
      const filtered = Object.fromEntries(
        Object.entries(current).filter(([key]) => !isErrorForStep(key, stepIndex)),
      );

      return {
        ...filtered,
        ...nextErrors,
      };
    });

    if (Object.keys(nextErrors).length > 0) {
      if (focusOnError) {
        shouldFocusErrorRef.current = true;
      }
      if (focusOnError && stepIndex === 2) {
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
  const validateStepOnBlur = (stepIndex: number) => {
    if (stepIndex !== currentStep) {
      return;
    }

    window.setTimeout(() => {
      validateStep(stepIndex, values, { focusOnError: false });
    }, 0);
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

  const goToStep = (stepIndex: number) => {
    if (stepIndex === currentStep) {
      return;
    }

    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex);
      return;
    }

    for (let index = currentStep; index < stepIndex; index += 1) {
      const valid = validateStep(index);

      if (!valid) {
        setCurrentStep(index);
        return;
      }
    }

    setCurrentStep(stepIndex);
  };

  const buildEmailFallbackHref = () => {
    const preparedValues = normalizeInquiryFormValues(values);
    const subject = encodeURIComponent(
      `The Sweet Fork inquiry for ${preparedValues.eventType || "my celebration"}`,
    );
    const selectedSummary =
      preparedValues.orderItems.length > 0
        ? preparedValues.orderItems
            .map(
              (item) =>
                `${getProductDisplayLabel(item.productType)}: ${formatSelectedItemSummary(item)}`,
            )
            .join("\n")
        : "No dessert selections yet";

    const body = encodeURIComponent(
      [
        "Hello,",
        "",
        "I started an inquiry on the website and would like to send the details by email.",
        "",
        `Event type: ${preparedValues.eventType || "Not set"}`,
        `Event date: ${preparedValues.eventDate || "Not set"}`,
        `Guest count: ${preparedValues.guestCount ?? "Not set"}`,
        `Fulfillment: ${preparedValues.fulfillmentMethod}`,
        `Delivery ZIP: ${preparedValues.deliveryZip ?? "Not needed / not set"}`,
        `Budget range: ${getBudgetRangeLabel(preparedValues.budgetRange)}`,
        `Budget flexibility: ${getBudgetFlexibilityLabel(preparedValues.budgetFlexibility)}`,
        "",
        "Desserts:",
        selectedSummary,
        "",
        `Color palette: ${preparedValues.colorPalette ?? "Not set"}`,
        `Inspiration notes: ${preparedValues.inspirationText ?? "Not set"}`,
        `Inspiration links: ${preparedValues.inspirationLinks.join(", ") || "None"}`,
        "",
        `Name: ${preparedValues.customerName || "Not set"}`,
        `Email: ${preparedValues.customerEmail || "Not set"}`,
        `Phone: ${preparedValues.customerPhone || "Not set"}`,
        `Preferred contact: ${preparedValues.preferredContact}`,
        `Instagram: ${preparedValues.instagramHandle ?? "Not set"}`,
        `How I heard about you: ${preparedValues.howDidYouHear ?? "Not set"}`,
        "",
        `Additional notes: ${preparedValues.additionalNotes ?? "None"}`,
      ].join("\n"),
    );

    return `mailto:thesweetfork@yahoo.com?subject=${subject}&body=${body}`;
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

    if (!submissionAvailable) {
      setSubmitError(
        "Online submission is paused. Use the email button below to send these details directly.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("payload", JSON.stringify(result.data));
      formData.append("startedAt", String(startedAt));
      formData.append("website", honeypotValue);

      const response = await fetch("/api/inquiries", {
        method: "POST",
        body: formData,
      });
      const responseText = await response.text();
      const payload = responseText
        ? (JSON.parse(responseText) as InquirySubmissionResponse | { error?: string })
        : null;

      if (!response.ok) {
        throw new Error(
          payload && "error" in payload && payload.error
            ? payload.error
            : "We could not submit the inquiry right now.",
        );
      }

      if (!payload || "error" in payload) {
        throw new Error("We could not submit the inquiry right now.");
      }

      setSubmissionResult(payload as InquirySubmissionResponse);
    } catch (error) {
      setSubmitError(getSafeSubmissionErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateFullInquiry = () => {
    setSubmitError(null);
    setErrors({});

    for (let stepIndex = 0; stepIndex < inquiryStepTitles.length; stepIndex += 1) {
      const valid = validateStep(stepIndex);

      if (!valid) {
        setCurrentStep(stepIndex);
        return false;
      }
    }

    const result = inquirySchema.safeParse(normalizeInquiryFormValues(values));

    if (!result.success) {
      const nextErrors = flattenIssues(result.error.issues);
      shouldFocusErrorRef.current = true;
      setErrors(nextErrors);
      setCurrentStep(findStepForErrors(nextErrors));
      return false;
    }

    return true;
  };

  const handleEmailFallbackClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (validateFullInquiry()) {
      return;
    }

    event.preventDefault();
  };

  const currentStepPanel = (
    <div
      className={cn(
        "rounded-[1.8rem] border px-4 py-4 transition-colors duration-300 sm:px-5 sm:py-5",
        hasStarted ? "border-charcoal/10 bg-cream/65 lg:px-5 lg:py-3.5" : "border-charcoal/8 bg-white",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
        Current step
      </p>
      <p
        ref={stepHeadingRef}
        tabIndex={-1}
        className={cn(
          "font-serif tracking-[-0.04em] text-charcoal focus:outline-none",
          hasStarted
            ? "mt-2 text-[1.9rem] leading-none sm:text-3xl lg:text-[1.55rem]"
            : "mt-3 text-3xl",
        )}
      >
        {inquiryStepTitles[currentStep]}
      </p>
      <p
        className={cn(
          "mt-2 text-sm text-charcoal/65",
          hasStarted ? "leading-6 lg:hidden" : "leading-7",
        )}
      >
        {inquiryStepDescriptions[currentStep]}
      </p>
      <p
        className={cn(
          "mt-2 text-sm text-charcoal/65",
          hasStarted ? "leading-6 lg:mt-1.5" : "leading-7",
        )}
      >
        {currentStep + 1} of {inquiryStepTitles.length}
      </p>
    </div>
  );

  if (submissionResult) {
    return (
      <section ref={successTopRef} className="section-shell pb-20">
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
    <section ref={wizardTopRef} className="section-shell pb-20">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="grain-surface overflow-hidden rounded-[2.4rem] border border-charcoal/10 bg-white shadow-soft">
          <div
            className={cn(
              "border-b border-charcoal/8 px-5 py-5 transition-[padding,background-color] duration-300 sm:px-8",
              hasStarted ? "bg-white/92" : "bg-cream/70 sm:py-6",
            )}
          >
            <div className="flex flex-col gap-4">
              <div
                className={cn(
                  "flex flex-col gap-4",
                  hasStarted && "lg:flex-row lg:items-start lg:justify-between lg:gap-6",
                )}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge>Custom dessert inquiry</Badge>
                  <p className="text-sm text-charcoal/60">
                    {hasStarted
                      ? "You can go back anytime to update your answers before submitting."
                      : "Tell us what you are planning."}
                  </p>
                </div>
                {hasStarted ? <div className="lg:w-[18rem] lg:flex-none">{currentStepPanel}</div> : null}
              </div>

              {!submissionAvailable ? (
                <div className="rounded-[1.4rem] border border-gold/28 bg-gold/10 px-4 py-3 text-sm leading-6 text-charcoal/72">
                  <p className="font-medium text-charcoal">Online submission is paused.</p>
                  <p className="mt-1">
                    {submissionUnavailableMessage ??
                      "You can still prepare your inquiry details here, then email The Sweet Fork directly from the review step."}
                  </p>
                </div>
              ) : catalogSource === "fallback" ? (
                <div className="rounded-[1.4rem] border border-charcoal/10 bg-cream/70 px-4 py-3 text-sm leading-6 text-charcoal/68">
                  Dessert options are available while The Sweet Fork refreshes a few menu details.
                </div>
              ) : null}

              {!hasStarted ? (
                <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                  <div className="min-w-0 space-y-2.5 sm:space-y-3">
                    <h2 className="font-serif text-[1.7rem] leading-[1.05] tracking-[-0.04em] text-charcoal sm:text-5xl sm:leading-tight">
                      Tell us about your order so we can prepare a custom quote.
                    </h2>
                    <p className="hidden max-w-2xl text-[0.95rem] leading-7 text-charcoal/70 sm:block sm:text-base sm:leading-8">
                      Choose your desserts, share your event date, add inspiration photos, and tell
                      us the best way to reach you. We&apos;ll review the details and follow up with
                      next steps.
                    </p>
                  </div>
                  {currentStepPanel}
                </div>
              ) : null}

              <div className="space-y-3">
                <p className="sr-only" aria-live="polite">
                  Step {currentStep + 1} of {inquiryStepTitles.length}: {inquiryStepTitles[currentStep]}.{" "}
                  {inquiryStepDescriptions[currentStep]}
                </p>
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
                  Fields marked <span className="font-medium text-rose-700" aria-label="required">*</span> are needed for a tailored quote.
                </p>
              </div>

              <div
                className="grid grid-cols-5 gap-2 pb-1 lg:flex lg:gap-3 lg:overflow-visible lg:pb-0"
                role="list"
                aria-label="Inquiry steps"
              >
                {inquiryStepTitles.map((title, index) => (
                  <StepMarker
                    key={title}
                    active={currentStep === index}
                    canSelect={index <= currentStep}
                    complete={index < currentStep}
                    description={inquiryStepDescriptions[index]}
                    index={index}
                    markerRef={(element) => {
                      stepMarkerRefs.current[index] = element;
                    }}
                    onSelect={() => goToStep(index)}
                    title={title}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-10">
            <div ref={stepViewportRef} className="scroll-mt-24 sm:scroll-mt-28" />
            <StepAlert
              message={stepHasError ? getStepErrorMessage(currentStep) : undefined}
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
                      Start with the event details so the dessert plan and quote begin with the
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
                    onBlur={() => validateStepOnBlur(0)}
                    placeholder="Birthday, wedding, shower, launch, holiday gathering..."
                    className={getFieldErrorClass(errors.eventType)}
                    required
                    aria-required="true"
                    aria-describedby={
                      errors.eventType ? getErrorDescriptionId("eventType") : undefined
                    }
                    aria-invalid={Boolean(errors.eventType)}
                  />
                  <InlineError id={getErrorDescriptionId("eventType")} message={errors.eventType} />
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
                  <div className="min-w-0">
                    <FieldLabel htmlFor="event-date" required>
                      Event date
                    </FieldLabel>
                    <Input
                      id="event-date"
                      ref={registerFieldRef("eventDate")}
                      type="date"
                      value={values.eventDate}
                      onChange={(event) => setFieldValue("eventDate", event.target.value)}
                      onBlur={() => validateStepOnBlur(0)}
                      onKeyDown={(event) => {
                        if ((event.key === "Enter" || event.key === " ") && "showPicker" in event.currentTarget) {
                          event.preventDefault();
                          event.currentTarget.showPicker?.();
                        }
                      }}
                      min={minimumEventDate}
                      className={getFieldErrorClass(errors.eventDate)}
                      required
                      aria-required="true"
                      aria-describedby={getDescribedBy(
                        "event-date-hint",
                        errors.eventDate && getErrorDescriptionId("eventDate"),
                      )}
                      aria-invalid={Boolean(errors.eventDate)}
                    />
                    <p id="event-date-hint" className="mt-2 text-sm text-charcoal/58">
                      Choose a future date. The Sweet Fork reviews inquiry timing in Mountain Time.
                    </p>
                    <InlineError id={getErrorDescriptionId("eventDate")} message={errors.eventDate} />
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor="guest-count">Guest count</Label>
                    <Input
                      id="guest-count"
                      ref={registerFieldRef("guestCount")}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={1000}
                      step={1}
                      value={values.guestCount ?? ""}
                      onChange={(event) => setNumericValue("guestCount", event.target.value)}
                      onBlur={() => validateStepOnBlur(0)}
                      placeholder="Approximate number of guests"
                      className={getFieldErrorClass(errors.guestCount)}
                      aria-describedby={
                        errors.guestCount ? getErrorDescriptionId("guestCount") : undefined
                      }
                      aria-invalid={Boolean(errors.guestCount)}
                    />
                    <InlineError id={getErrorDescriptionId("guestCount")} message={errors.guestCount} />
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                  <div className="space-y-3">
                    <FieldLabel id="fulfillment-type-label" required>Fulfillment type</FieldLabel>
                    <div
                      className="grid gap-3 sm:grid-cols-2"
                      role="group"
                      aria-labelledby="fulfillment-type-label"
                      aria-describedby={
                        errors.fulfillmentMethod
                          ? getErrorDescriptionId("fulfillmentMethod")
                          : undefined
                      }
                    >
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
                    <InlineError
                      id={getErrorDescriptionId("fulfillmentMethod")}
                      message={errors.fulfillmentMethod}
                    />
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
                      onBlur={() => validateStepOnBlur(0)}
                      placeholder={
                        values.fulfillmentMethod === "delivery"
                          ? "Required for delivery requests"
                          : "Only needed if delivery is selected"
                      }
                      pattern="\\d{5}(?:-\\d{4})?"
                      maxLength={10}
                      className={getFieldErrorClass(errors.deliveryZip)}
                      aria-describedby={
                        errors.deliveryZip ? getErrorDescriptionId("deliveryZip") : undefined
                      }
                      aria-invalid={Boolean(errors.deliveryZip)}
                    />
                    <InlineError id={getErrorDescriptionId("deliveryZip")} message={errors.deliveryZip} />
                  </div>
                </div>

                <div>
                  <FieldLabel id="budget-range-label" required>Comfortable budget range</FieldLabel>
                  <div
                    className="grid gap-3 md:grid-cols-2"
                    role="group"
                    aria-labelledby="budget-range-label"
                    aria-describedby={
                      errors.budgetRange ? getErrorDescriptionId("budgetRange") : undefined
                    }
                  >
                    {budgetRangeOptions.map((option, index) => (
                      <button
                        key={option.value}
                        type="button"
                        ref={index === 0 ? registerFieldRef("budgetRange") : undefined}
                        aria-pressed={values.budgetRange === option.value}
                        className={cn(
                          "rounded-[1.4rem] border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50 sm:rounded-[1.6rem] sm:py-4",
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
                            "mt-1 text-xs leading-5 sm:text-sm sm:leading-6",
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
                  <InlineError
                    id={getErrorDescriptionId("budgetRange")}
                    message={errors.budgetRange}
                  />
                </div>

                <div>
                  <FieldLabel id="budget-flexibility-label" required>Budget flexibility</FieldLabel>
                  <div
                    className="grid gap-3 md:grid-cols-3"
                    role="group"
                    aria-labelledby="budget-flexibility-label"
                    aria-describedby={
                      errors.budgetFlexibility
                        ? getErrorDescriptionId("budgetFlexibility")
                        : undefined
                    }
                  >
                    {budgetFlexibilityOptions.map((option, index) => (
                      <button
                        key={option.value}
                        type="button"
                        ref={index === 0 ? registerFieldRef("budgetFlexibility") : undefined}
                        aria-pressed={values.budgetFlexibility === option.value}
                        className={cn(
                          "rounded-[1.6rem] border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50",
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
                  <InlineError
                    id={getErrorDescriptionId("budgetFlexibility")}
                    message={errors.budgetFlexibility}
                  />
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
                      Select every sweet you want The Sweet Fork to consider for this event. One
                      inquiry can cover the full dessert story.
                    </p>
                  </div>
                  <PartyPopper className="h-6 w-6 text-charcoal/45" />
                </div>

                <div
                  className="grid gap-4 md:grid-cols-2"
                  role="group"
                  aria-label="Dessert selections"
                  aria-describedby={errors.orderItems ? getErrorDescriptionId("orderItems") : undefined}
                >
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
                          "rounded-[1.9rem] border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50 sm:p-5",
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
                <InlineError id={getErrorDescriptionId("orderItems")} message={errors.orderItems} />
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

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {selectedItems.map((item) => {
                    const ready = inquiryItemDetailsSchema.safeParse({
                      orderItems: [item],
                    }).success;

                    return (
                      <button
                        key={item.productType}
                        type="button"
                        aria-pressed={activeItem?.productType === item.productType}
                        className={cn(
                          "w-full rounded-[1.35rem] border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50",
                          activeItem?.productType === item.productType
                            ? "border-charcoal bg-charcoal text-ivory"
                            : "border-charcoal/10 bg-white text-charcoal",
                        )}
                        onClick={() => setActiveItemType(item.productType)}
                      >
                        <div className="flex min-w-0 items-center justify-between gap-3">
                          <p className="min-w-0 text-sm font-medium">
                            {catalogMap[item.productType]?.name ?? getProductDisplayLabel(item.productType)}
                          </p>
                          {activeItem?.productType === item.productType ? (
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ivory text-charcoal">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          ) : null}
                        </div>
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

                <div className="rounded-[1.6rem] border border-charcoal/8 bg-cream/45 px-4 py-4 text-sm leading-7 text-charcoal/66">
                  Counts or servings marked <span className="font-medium text-rose-700" aria-label="required">*</span> are needed before The Sweet Fork can review that item confidently.
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
                          <FieldLabel htmlFor={`${activeItem.productType}-servings`} required>
                            Estimated servings
                          </FieldLabel>
                          <Input
                            id={`${activeItem.productType}-servings`}
                            ref={(element) => {
                              registerFieldRef(itemPath(activeItem.productType, "servings"))(element);
                              if (activeItem.productType === "wedding-cake") {
                                registerFieldRef(itemPath(activeItem.productType, "weddingServings"))(element);
                              }
                            }}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={activeItem.productType === "wedding-cake" ? 600 : 500}
                            step={1}
                            value={
                              activeItem.productType === "wedding-cake"
                                ? activeItem.weddingServings ?? activeItem.servings ?? ""
                                : activeItem.servings ?? ""
                            }
                            onBlur={() => validateStepOnBlur(2)}
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
                            required
                            aria-required="true"
                            className={getFieldErrorClass(
                              errors[itemPath(activeItem.productType, "servings")],
                              errors[itemPath(activeItem.productType, "weddingServings")],
                            )}
                            aria-describedby={
                              errors[itemPath(activeItem.productType, "servings")] ||
                              errors[itemPath(activeItem.productType, "weddingServings")]
                                ? getErrorDescriptionId(itemPath(activeItem.productType, "servings"))
                                : undefined
                            }
                            aria-invalid={Boolean(
                              errors[itemPath(activeItem.productType, "servings")] ||
                                errors[itemPath(activeItem.productType, "weddingServings")],
                            )}
                          />
                          <InlineError
                            id={getErrorDescriptionId(itemPath(activeItem.productType, "servings"))}
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
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={6}
                            step={1}
                            value={activeItem.tiers ?? ""}
                            onBlur={() => validateStepOnBlur(2)}
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
                        <FieldLabel htmlFor="cupcake-count" required>
                          Cupcake count
                        </FieldLabel>
                        <Input
                          id="cupcake-count"
                          ref={registerFieldRef(itemPath(activeItem.productType, "cupcakeCount"))}
                          type="number"
                          inputMode="numeric"
                          min={12}
                          max={500}
                          step={1}
                          value={activeItem.cupcakeCount ?? ""}
                          onBlur={() => validateStepOnBlur(2)}
                          onChange={(event) =>
                            updateOrderItem("cupcakes", {
                              cupcakeCount:
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                            })
                          }
                          placeholder="24 or 48"
                          required
                          aria-required="true"
                          className={getFieldErrorClass(errors[itemPath(activeItem.productType, "cupcakeCount")])}
                          aria-describedby={
                            errors[itemPath(activeItem.productType, "cupcakeCount")]
                              ? getErrorDescriptionId(itemPath(activeItem.productType, "cupcakeCount"))
                              : undefined
                          }
                          aria-invalid={Boolean(
                            errors[itemPath(activeItem.productType, "cupcakeCount")],
                          )}
                        />
                        <InlineError
                          id={getErrorDescriptionId(itemPath(activeItem.productType, "cupcakeCount"))}
                          message={errors[itemPath(activeItem.productType, "cupcakeCount")]}
                        />
                      </div>
                    )}

                    {activeItem.productType === "sugar-cookies" && (
                      <div>
                        <FieldLabel htmlFor="cookie-count" required>
                          Cookie count
                        </FieldLabel>
                        <Input
                          id="cookie-count"
                          ref={registerFieldRef(itemPath(activeItem.productType, "cookieCount"))}
                          type="number"
                          inputMode="numeric"
                          min={12}
                          max={500}
                          step={1}
                          value={activeItem.cookieCount ?? ""}
                          onBlur={() => validateStepOnBlur(2)}
                          onChange={(event) =>
                            updateOrderItem("sugar-cookies", {
                              cookieCount:
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                            })
                          }
                          placeholder="24 or 48"
                          required
                          aria-required="true"
                          className={getFieldErrorClass(errors[itemPath(activeItem.productType, "cookieCount")])}
                          aria-describedby={
                            errors[itemPath(activeItem.productType, "cookieCount")]
                              ? getErrorDescriptionId(itemPath(activeItem.productType, "cookieCount"))
                              : undefined
                          }
                          aria-invalid={Boolean(
                            errors[itemPath(activeItem.productType, "cookieCount")],
                          )}
                        />
                        <InlineError
                          id={getErrorDescriptionId(itemPath(activeItem.productType, "cookieCount"))}
                          message={errors[itemPath(activeItem.productType, "cookieCount")]}
                        />
                      </div>
                    )}

                    {activeItem.productType === "macarons" && (
                      <div>
                        <FieldLabel htmlFor="macaron-count" required>
                          Macaron count
                        </FieldLabel>
                        <Input
                          id="macaron-count"
                          ref={registerFieldRef(itemPath(activeItem.productType, "macaronCount"))}
                          type="number"
                          inputMode="numeric"
                          min={12}
                          max={500}
                          step={1}
                          value={activeItem.macaronCount ?? ""}
                          onBlur={() => validateStepOnBlur(2)}
                          onChange={(event) =>
                            updateOrderItem("macarons", {
                              macaronCount:
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                            })
                          }
                          placeholder="24 or 48"
                          required
                          aria-required="true"
                          className={getFieldErrorClass(errors[itemPath(activeItem.productType, "macaronCount")])}
                          aria-describedby={
                            errors[itemPath(activeItem.productType, "macaronCount")]
                              ? getErrorDescriptionId(itemPath(activeItem.productType, "macaronCount"))
                              : undefined
                          }
                          aria-invalid={Boolean(
                            errors[itemPath(activeItem.productType, "macaronCount")],
                          )}
                        />
                        <InlineError
                          id={getErrorDescriptionId(itemPath(activeItem.productType, "macaronCount"))}
                          message={errors[itemPath(activeItem.productType, "macaronCount")]}
                        />
                      </div>
                    )}

                    {activeItem.productType === "diy-kit" && (
                      <div>
                        <FieldLabel htmlFor="kit-count" required>
                          Kit quantity
                        </FieldLabel>
                        <Input
                          id="kit-count"
                          ref={registerFieldRef(itemPath(activeItem.productType, "kitCount"))}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={40}
                          step={1}
                          value={activeItem.kitCount ?? ""}
                          onBlur={() => validateStepOnBlur(2)}
                          onChange={(event) =>
                            updateOrderItem("diy-kit", {
                              kitCount:
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                            })
                          }
                          placeholder="How many kits do you need?"
                          required
                          aria-required="true"
                          className={getFieldErrorClass(errors[itemPath(activeItem.productType, "kitCount")])}
                          aria-describedby={
                            errors[itemPath(activeItem.productType, "kitCount")]
                              ? getErrorDescriptionId(itemPath(activeItem.productType, "kitCount"))
                              : undefined
                          }
                          aria-invalid={Boolean(
                            errors[itemPath(activeItem.productType, "kitCount")],
                          )}
                        />
                        <InlineError
                          id={getErrorDescriptionId(itemPath(activeItem.productType, "kitCount"))}
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
                      Style & inspiration
                    </p>
                    <p className="text-sm leading-7 text-charcoal/68">
                      Share any inspiration links or describe the look you have in mind. Pinterest boards, Instagram posts, invitations, color palettes, florals, and mood-board links are all helpful.
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

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <Label className="mb-0">Inspiration links</Label>
                        <p className="text-xs uppercase tracking-[0.16em] text-charcoal/45">
                          {featureFlags.linkFallbackEnabled ? "Optional" : "Currently unavailable"}
                        </p>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-charcoal/60">
                        Paste Pinterest, Instagram, Canva, Google Drive, or other inspiration links here.
                      </p>
                      {featureFlags.linkFallbackEnabled ? (
                        <div className="mt-3 space-y-3">
                          {values.inspirationLinks.map((link, index) => (
                            <div key={`inspiration-link-${index}`} className="flex gap-3">
                              <Input
                                id={`inspiration-link-${index}`}
                                ref={index === 0 ? registerFieldRef("inspirationLinks") : undefined}
                                value={link}
                                onChange={(event) =>
                                  setInspirationLink(index, event.target.value)
                                }
                                onBlur={() => validateStepOnBlur(3)}
                                placeholder="Pinterest board, Instagram post, venue gallery..."
                                className={getFieldErrorClass(errors.inspirationLinks)}
                                aria-describedby={
                                  errors.inspirationLinks
                                    ? getErrorDescriptionId("inspirationLinks")
                                    : undefined
                                }
                                aria-invalid={Boolean(errors.inspirationLinks)}
                              />
                              <button
                              type="button"
                              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-charcoal/10 text-charcoal transition hover:border-charcoal/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50"
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
                          Share written notes instead when links are unavailable.
                        </p>
                      )}
                      <InlineError
                        id={getErrorDescriptionId("inspirationLinks")}
                        message={errors.inspirationLinks}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="inspiration-text">Style notes</Label>
                    <p className="mt-1 mb-3 text-sm leading-7 text-charcoal/60">
                      Tell us about colors, themes, florals, textures, favorite designs, or anything you want us to know.
                    </p>
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
                      aria-describedby={
                        errors.inspirationText
                          ? getErrorDescriptionId("inspirationText")
                          : undefined
                      }
                      aria-invalid={Boolean(errors.inspirationText)}
                    />
                    <InlineError
                      id={getErrorDescriptionId("inspirationText")}
                      message={errors.inspirationText}
                    />
                  </div>
                </div>

                <div className="rounded-[2rem] border border-charcoal/10 bg-cream/45 px-5 py-6 sm:px-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-charcoal/45">
                    Optional
                  </p>
                  <p className="mt-3 text-sm leading-7 text-charcoal/68">
                    No inspiration ready yet? That is completely okay — we can help shape the design from your event details.
                  </p>
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
                      onBlur={() => validateStepOnBlur(4)}
                      placeholder="Full name"
                      className={getFieldErrorClass(errors.customerName)}
                      autoComplete="name"
                      required
                      aria-required="true"
                      aria-describedby={
                        errors.customerName ? getErrorDescriptionId("customerName") : undefined
                      }
                      aria-invalid={Boolean(errors.customerName)}
                    />
                    <InlineError id={getErrorDescriptionId("customerName")} message={errors.customerName} />
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
                      onBlur={() => validateStepOnBlur(4)}
                      placeholder="hello@yourmail.com"
                      className={getFieldErrorClass(errors.customerEmail)}
                      autoComplete="email"
                      required
                      aria-required="true"
                      aria-describedby={
                        errors.customerEmail ? getErrorDescriptionId("customerEmail") : undefined
                      }
                      aria-invalid={Boolean(errors.customerEmail)}
                    />
                    <InlineError id={getErrorDescriptionId("customerEmail")} message={errors.customerEmail} />
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
                      onBlur={() => validateStepOnBlur(4)}
                      placeholder="(555) 555-5555"
                      className={getFieldErrorClass(errors.customerPhone)}
                      autoComplete="tel"
                      inputMode="tel"
                      required
                      aria-required="true"
                      aria-describedby={
                        errors.customerPhone ? getErrorDescriptionId("customerPhone") : undefined
                      }
                      aria-invalid={Boolean(errors.customerPhone)}
                    />
                    <InlineError id={getErrorDescriptionId("customerPhone")} message={errors.customerPhone} />
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
                    <FieldLabel id="preferred-contact-label" required>Preferred contact method</FieldLabel>
                    <div
                      className="grid gap-3 sm:grid-cols-3"
                      role="group"
                      aria-labelledby="preferred-contact-label"
                      aria-describedby={
                        errors.preferredContact
                          ? getErrorDescriptionId("preferredContact")
                          : undefined
                      }
                    >
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
                    <InlineError
                      id={getErrorDescriptionId("preferredContact")}
                      message={errors.preferredContact}
                    />
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
                          className="rounded-full border border-white/12 px-3 py-1 text-xs uppercase tracking-[0.16em] text-ivory/78 transition hover:border-white/24 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50"
                          onClick={() => goToStep(0)}
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
                          className="rounded-full border border-white/12 px-3 py-1 text-xs uppercase tracking-[0.16em] text-ivory/78 transition hover:border-white/24 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50"
                          onClick={() => goToStep(2)}
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
                          className="rounded-full border border-white/12 px-3 py-1 text-xs uppercase tracking-[0.16em] text-ivory/78 transition hover:border-white/24 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50"
                          onClick={() => goToStep(3)}
                        >
                          Edit
                        </button>
                      </div>
                      <div className="mt-4 space-y-3 text-sm leading-7 text-ivory/72">
                        <p>Overall palette: {normalizedValues.colorPalette ?? "Not shared yet"}</p>
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
                          className="rounded-full border border-white/12 px-3 py-1 text-xs uppercase tracking-[0.16em] text-ivory/78 transition hover:border-white/24 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50"
                          onClick={() => goToStep(4)}
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
                  You can go back anytime to update your answers before submitting.
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
                ) : !submissionAvailable ? (
                  <a
                    href={buildEmailFallbackHref()}
                    onClick={handleEmailFallbackClick}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-ivory shadow-soft transition hover:bg-charcoal/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50 sm:w-auto"
                  >
                    Email inquiry details
                  </a>
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
              <p>1. The Sweet Fork reviews the event details, selected desserts, and inspiration.</p>
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
