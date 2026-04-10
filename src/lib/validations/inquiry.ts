import { z } from "zod";

import type { InquiryFeatureFlags } from "@/lib/inquiries/config";
import { defaultInquiryFeatureFlags } from "@/lib/inquiries/config";
import {
  budgetFlexibilityValues,
  budgetRangeValues,
  productTypes,
} from "@/types/domain";

const bakeryTimeZone = "America/Denver";
const controlCharacterPattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const dateInputPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const htmlTagPattern = /<[^>]*>/g;
const instagramHandlePattern = /^@?[a-z0-9._]{1,30}$/i;
const instagramUrlPattern =
  /^https?:\/\/(?:www\.)?instagram\.com\/([a-z0-9._]{1,30})(?:[/?#].*)?$/i;
const zipCodePattern = /^\d{5}(?:-\d{4})?$/;
const imageMimePattern = /^image\//;
const phoneAllowedPattern = /^[+\d().\-\s]+$/;

export const MAX_INSPIRATION_UPLOADS = 6;
export const MAX_INSPIRATION_FILE_SIZE_BYTES = 8 * 1024 * 1024;
export const MAX_INQUIRY_PAYLOAD_SIZE_BYTES = 75_000;

const trimmedOptionalString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

function getDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: bakeryTimeZone,
    year: "numeric",
  }).formatToParts(date);

  return {
    day: parts.find((part) => part.type === "day")?.value ?? "01",
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    year: parts.find((part) => part.type === "year")?.value ?? "1970",
  };
}

function parseDateInput(value: string) {
  const match = dateInputPattern.exec(value);

  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function countPhoneDigits(value: string) {
  return value.replace(/\D/g, "").length;
}

function sanitizeTextValue(value: string, options: { multiline?: boolean } = {}) {
  const normalized = value
    .replace(/\r\n?/g, "\n")
    .replace(controlCharacterPattern, " ")
    .replace(htmlTagPattern, " ");

  const collapsed = options.multiline
    ? normalized.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n")
    : normalized.replace(/\s+/g, " ");

  return collapsed.trim();
}

function sanitizeOptionalTextValue(
  value: string | undefined,
  options: { multiline?: boolean } = {},
) {
  if (!value) {
    return undefined;
  }

  const sanitized = sanitizeTextValue(value, options);
  return sanitized.length > 0 ? sanitized : undefined;
}

function getRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return undefined;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function normalizeDeliveryZip(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, "").trim();
  return normalized.length > 0 ? normalized.slice(0, 10) : undefined;
}

function normalizeInstagramHandle(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const sanitized = sanitizeTextValue(value);

  if (sanitized.length === 0) {
    return undefined;
  }

  const urlMatch = instagramUrlPattern.exec(sanitized);
  const candidate = urlMatch?.[1] ?? sanitized.replace(/^@+/, "");
  const handle = candidate.replace(/[^a-z0-9._]/gi, "").slice(0, 30);

  return handle.length > 0 ? `@${handle}` : undefined;
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

export function getMinimumInquiryDate(referenceDate = new Date()) {
  const { day, month, year } = getDateParts(referenceDate);
  return `${year}-${month}-${day}`;
}

const futureDateSchema = z
  .string()
  .trim()
  .min(1, "Choose your event date.")
  .refine((value) => Boolean(parseDateInput(value)), {
    message: "Enter a valid event date.",
  })
  .refine((value) => value >= getMinimumInquiryDate(), "Event date cannot be in the past.");

export const inquiryItemSchema = z
  .object({
    productType: z.enum(productTypes),
    quantity: z.coerce.number().int().min(1).max(100),
    servings: z.coerce.number().int().min(1).max(500).optional(),
    flavorNotes: trimmedOptionalString(600),
    designNotes: trimmedOptionalString(1200),
    inspirationNotes: trimmedOptionalString(1200),
    sizeLabel: trimmedOptionalString(80),
    tiers: z.coerce.number().int().min(1).max(6).optional(),
    shape: z.enum(["round", "heart", "sheet", "tiered", "mini", "assorted"]).optional(),
    icingStyle: z.enum(["buttercream", "fondant", "textured", "painted", "mixed"]).optional(),
    cupcakeCount: z.coerce.number().int().min(12).max(500).optional(),
    cookieCount: z.coerce.number().int().min(12).max(500).optional(),
    macaronCount: z.coerce.number().int().min(12).max(500).optional(),
    kitCount: z.coerce.number().int().min(1).max(40).optional(),
    weddingServings: z.coerce.number().int().min(20).max(600).optional(),
    topperText: trimmedOptionalString(80),
    colorPalette: trimmedOptionalString(150),
  })
  .superRefine((value, ctx) => {
    if (
      (value.productType === "custom-cake" || value.productType === "wedding-cake") &&
      !value.servings &&
      !value.weddingServings
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["servings"],
        message: "Cake selections need an estimated serving count.",
      });
    }

    if (value.productType === "cupcakes" && !value.cupcakeCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cupcakeCount"],
        message: "Cupcake count is required.",
      });
    }

    if (value.productType === "sugar-cookies" && !value.cookieCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cookieCount"],
        message: "Cookie count is required.",
      });
    }

    if (value.productType === "macarons" && !value.macaronCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["macaronCount"],
        message: "Macaron count is required.",
      });
    }

    if (value.productType === "diy-kit" && !value.kitCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["kitCount"],
        message: "DIY kit quantity is required.",
      });
    }
  });

const inquiryEventDetailsBaseSchema = z.object({
  eventType: z.string().trim().min(2, "Tell us what you are celebrating.").max(80),
  eventDate: futureDateSchema,
  guestCount: z.coerce.number().int().min(1).max(1000).optional(),
  fulfillmentMethod: z.enum(["pickup", "delivery"]),
  deliveryZip: z.string().trim().optional(),
  budgetRange: z.enum(budgetRangeValues, {
    errorMap: () => ({ message: "Choose the overall budget range." }),
  }),
  budgetFlexibility: z.enum(budgetFlexibilityValues, {
    errorMap: () => ({ message: "Choose how flexible the budget is." }),
  }),
});

function addEventRefinements<Schema extends z.ZodTypeAny>(
  schema: Schema,
): z.ZodEffects<Schema, z.output<Schema>, z.input<Schema>> {
  return schema.superRefine((value, ctx) => {
    const eventValue = value as z.infer<typeof inquiryEventDetailsBaseSchema>;

    if (eventValue.fulfillmentMethod === "delivery") {
      if (!eventValue.deliveryZip) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["deliveryZip"],
          message: "Delivery requests need a ZIP code.",
        });
      } else if (!zipCodePattern.test(eventValue.deliveryZip)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["deliveryZip"],
          message: "Enter a valid ZIP code.",
        });
      }
    }
  }) as z.ZodEffects<Schema, z.output<Schema>, z.input<Schema>>;
}

export const inquiryEventDetailsSchema = addEventRefinements(
  inquiryEventDetailsBaseSchema,
);

export const inquirySelectionSchema = z.object({
  orderItems: z
    .array(
      z.object({
        productType: z.enum(productTypes),
      }),
    )
    .min(1, "Select at least one product to continue."),
});

export const inquiryItemDetailsSchema = z.object({
  orderItems: z.array(inquiryItemSchema).min(1),
});

export const inquiryInspirationSchema = z.object({
  colorPalette: trimmedOptionalString(160),
  inspirationLinks: z.array(z.string().trim().url("Enter a valid inspiration link.")).max(6),
  inspirationText: trimmedOptionalString(1200),
});

export const inquiryContactSchema = z.object({
  customerName: z.string().trim().min(2, "Enter your name.").max(120),
  customerEmail: z.string().trim().email("Enter a valid email address."),
  customerPhone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number with area code.")
    .max(30)
    .refine((value) => phoneAllowedPattern.test(value), {
      message: "Use numbers and standard phone punctuation only.",
    })
    .refine((value) => {
      const digits = countPhoneDigits(value);
      return digits >= 10 && digits <= 15;
    }, "Enter a valid phone number with area code."),
  instagramHandle: z
    .string()
    .trim()
    .max(31)
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || instagramHandlePattern.test(value), {
      message: "Use an Instagram handle like @sweetfork.",
    }),
  preferredContact: z.enum(["email", "text", "phone"]),
  howDidYouHear: trimmedOptionalString(120),
  additionalNotes: trimmedOptionalString(2000),
});

export const inquirySchema = addEventRefinements(
  inquiryEventDetailsBaseSchema
    .merge(inquiryItemDetailsSchema)
    .merge(inquiryInspirationSchema)
    .merge(inquiryContactSchema),
);

export type InquiryFormValues = z.infer<typeof inquirySchema>;

export function normalizeInquiryFormValues(values: unknown): InquiryFormValues {
  const source = getRecord(values);
  const orderItems = Array.isArray(source.orderItems)
    ? source.orderItems
        .map((item) =>
          item && typeof item === "object"
            ? (item as Partial<InquiryFormValues["orderItems"][number]>)
            : null,
        )
        .filter(
          (
            item,
          ): item is Partial<InquiryFormValues["orderItems"][number]> & {
            productType: string;
          } => Boolean(item && typeof item.productType === "string"),
        )
    : [];
  const inspirationLinks = toStringArray(source.inspirationLinks);

  return {
    eventType: sanitizeTextValue(
      typeof source.eventType === "string" ? source.eventType : "",
    ),
    eventDate: typeof source.eventDate === "string" ? source.eventDate.trim() : "",
    guestCount:
      toFiniteNumber(source.guestCount),
    fulfillmentMethod:
      typeof source.fulfillmentMethod === "string"
        ? (source.fulfillmentMethod as InquiryFormValues["fulfillmentMethod"])
        : ("" as InquiryFormValues["fulfillmentMethod"]),
    deliveryZip: normalizeDeliveryZip(source.deliveryZip),
    budgetRange:
      typeof source.budgetRange === "string"
        ? (source.budgetRange as InquiryFormValues["budgetRange"])
        : ("" as InquiryFormValues["budgetRange"]),
    budgetFlexibility:
      typeof source.budgetFlexibility === "string"
        ? (source.budgetFlexibility as InquiryFormValues["budgetFlexibility"])
        : ("" as InquiryFormValues["budgetFlexibility"]),
    colorPalette:
      typeof source.colorPalette === "string"
        ? sanitizeOptionalTextValue(source.colorPalette)
        : undefined,
    inspirationLinks: inspirationLinks
      .map((link) => link.trim())
      .filter((link): link is string => Boolean(link)),
    inspirationText:
      typeof source.inspirationText === "string"
        ? sanitizeOptionalTextValue(source.inspirationText, { multiline: true })
        : undefined,
    customerName: sanitizeTextValue(
      typeof source.customerName === "string" ? source.customerName : "",
    ),
    customerEmail:
      typeof source.customerEmail === "string"
        ? source.customerEmail.trim().toLowerCase()
        : "",
    customerPhone: sanitizeTextValue(
      typeof source.customerPhone === "string" ? source.customerPhone : "",
    ),
    instagramHandle: normalizeInstagramHandle(source.instagramHandle),
    preferredContact:
      typeof source.preferredContact === "string"
        ? (source.preferredContact as InquiryFormValues["preferredContact"])
        : ("" as InquiryFormValues["preferredContact"]),
    howDidYouHear:
      typeof source.howDidYouHear === "string"
        ? sanitizeOptionalTextValue(source.howDidYouHear)
        : undefined,
    additionalNotes:
      typeof source.additionalNotes === "string"
        ? sanitizeOptionalTextValue(source.additionalNotes, { multiline: true })
        : undefined,
    orderItems: orderItems.map((item) => ({
      productType: item.productType as InquiryFormValues["orderItems"][number]["productType"],
      quantity: toFiniteNumber(item.quantity) ?? 1,
      servings: toFiniteNumber(item.servings),
      flavorNotes:
        typeof item.flavorNotes === "string"
          ? sanitizeOptionalTextValue(item.flavorNotes, { multiline: true })
          : undefined,
      designNotes:
        typeof item.designNotes === "string"
          ? sanitizeOptionalTextValue(item.designNotes, { multiline: true })
          : undefined,
      inspirationNotes:
        typeof item.inspirationNotes === "string"
          ? sanitizeOptionalTextValue(item.inspirationNotes, { multiline: true })
          : undefined,
      sizeLabel:
        typeof item.sizeLabel === "string" ? sanitizeOptionalTextValue(item.sizeLabel) : undefined,
      tiers: toFiniteNumber(item.tiers),
      shape:
        typeof item.shape === "string"
          ? (item.shape as InquiryFormValues["orderItems"][number]["shape"])
          : undefined,
      icingStyle:
        typeof item.icingStyle === "string"
          ? (item.icingStyle as InquiryFormValues["orderItems"][number]["icingStyle"])
          : undefined,
      cupcakeCount: toFiniteNumber(item.cupcakeCount),
      cookieCount: toFiniteNumber(item.cookieCount),
      macaronCount: toFiniteNumber(item.macaronCount),
      kitCount: toFiniteNumber(item.kitCount),
      weddingServings: toFiniteNumber(item.weddingServings),
      topperText:
        typeof item.topperText === "string"
          ? sanitizeOptionalTextValue(item.topperText)
          : undefined,
      colorPalette:
        typeof item.colorPalette === "string"
          ? sanitizeOptionalTextValue(item.colorPalette)
          : undefined,
    })),
  };
}

export function validateInspirationUploads(
  files: File[],
  flags: InquiryFeatureFlags = defaultInquiryFeatureFlags,
) {
  const issues: string[] = [];

  if (!flags.uploadsEnabled && files.length > 0) {
    issues.push("Image uploads are turned off right now. Use links or notes instead.");
  }

  if (files.length > MAX_INSPIRATION_UPLOADS) {
    issues.push(`You can upload up to ${MAX_INSPIRATION_UPLOADS} inspiration images.`);
  }

  files.forEach((file) => {
    const fileLabel = file.name || "This upload";

    if (file.size === 0) {
      issues.push(`${fileLabel} is empty.`);
    }

    if (!imageMimePattern.test(file.type)) {
      issues.push(`${fileLabel} is not an image file.`);
    }

    if (file.size > MAX_INSPIRATION_FILE_SIZE_BYTES) {
      issues.push(`${fileLabel} is larger than 8 MB.`);
    }
  });

  return issues;
}

export function createEmptyInquiryValues(): InquiryFormValues {
  return {
    eventType: "",
    eventDate: "",
    guestCount: undefined,
    fulfillmentMethod: "pickup",
    deliveryZip: undefined,
    budgetRange: "not-sure",
    budgetFlexibility: "moderate",
    orderItems: [],
    colorPalette: undefined,
    inspirationLinks: [],
    inspirationText: undefined,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    instagramHandle: undefined,
    preferredContact: "email",
    howDidYouHear: undefined,
    additionalNotes: undefined,
  };
}
