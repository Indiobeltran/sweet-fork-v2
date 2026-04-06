import { z } from "zod";

import type { InquiryFeatureFlags } from "@/lib/inquiries/config";
import { defaultInquiryFeatureFlags } from "@/lib/inquiries/config";
import {
  budgetFlexibilityValues,
  budgetRangeValues,
  productTypes,
} from "@/types/domain";

const zipCodePattern = /^\d{5}(?:-\d{4})?$/;
const imageMimePattern = /^image\//;

export const MAX_INSPIRATION_UPLOADS = 6;
export const MAX_INSPIRATION_FILE_SIZE_BYTES = 8 * 1024 * 1024;

const trimmedOptionalString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const futureDateSchema = z
  .string()
  .min(1, "Choose your event date.")
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()), {
    message: "Enter a valid event date.",
  })
  .refine((value) => {
    const selected = new Date(`${value}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selected >= today;
  }, "Event date cannot be in the past.");

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
  customerPhone: z.string().trim().min(7, "Enter a valid phone number.").max(30),
  instagramHandle: trimmedOptionalString(60),
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

export function normalizeInquiryFormValues(values: InquiryFormValues): InquiryFormValues {
  return {
    ...values,
    eventType: values.eventType.trim(),
    deliveryZip: values.deliveryZip?.trim() || undefined,
    colorPalette: values.colorPalette?.trim() || undefined,
    inspirationLinks: values.inspirationLinks
      .map((link: string) => link.trim())
      .filter((link): link is string => Boolean(link)),
    inspirationText: values.inspirationText?.trim() || undefined,
    customerName: values.customerName.trim(),
    customerEmail: values.customerEmail.trim(),
    customerPhone: values.customerPhone.trim(),
    instagramHandle: values.instagramHandle?.trim() || undefined,
    howDidYouHear: values.howDidYouHear?.trim() || undefined,
    additionalNotes: values.additionalNotes?.trim() || undefined,
    orderItems: values.orderItems.map((item: InquiryFormValues["orderItems"][number]) => ({
      ...item,
      flavorNotes: item.flavorNotes?.trim() || undefined,
      designNotes: item.designNotes?.trim() || undefined,
      inspirationNotes: item.inspirationNotes?.trim() || undefined,
      sizeLabel: item.sizeLabel?.trim() || undefined,
      topperText: item.topperText?.trim() || undefined,
      colorPalette: item.colorPalette?.trim() || undefined,
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
    if (!imageMimePattern.test(file.type)) {
      issues.push(`${file.name} is not an image file.`);
    }

    if (file.size > MAX_INSPIRATION_FILE_SIZE_BYTES) {
      issues.push(`${file.name} is larger than 8 MB.`);
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
