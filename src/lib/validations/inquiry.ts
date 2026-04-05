import { z } from "zod";

import { productTypes } from "@/types/domain";

export const inquiryItemSchema = z
  .object({
    productType: z.enum(productTypes),
    quantity: z.coerce.number().int().min(1).max(100),
    servings: z.coerce.number().int().min(1).max(500).optional(),
    flavorNotes: z.string().max(600).optional(),
    designNotes: z.string().max(1200).optional(),
    inspirationNotes: z.string().max(1200).optional(),
    sizeLabel: z.string().max(80).optional(),
    tiers: z.coerce.number().int().min(1).max(6).optional(),
    shape: z.enum(["round", "heart", "sheet", "tiered", "mini", "assorted"]).optional(),
    icingStyle: z.enum(["buttercream", "fondant", "textured", "painted", "mixed"]).optional(),
    cupcakeCount: z.coerce.number().int().min(12).max(500).optional(),
    cookieCount: z.coerce.number().int().min(12).max(500).optional(),
    macaronCount: z.coerce.number().int().min(12).max(500).optional(),
    kitCount: z.coerce.number().int().min(1).max(40).optional(),
    weddingServings: z.coerce.number().int().min(20).max(600).optional(),
    topperText: z.string().max(80).optional(),
    colorPalette: z.string().max(150).optional(),
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
        message: "Cake inquiries need an estimated serving count.",
      });
    }

    if (value.productType === "cupcakes" && !value.cupcakeCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cupcakeCount"],
        message: "Cupcake quantity is required.",
      });
    }

    if (value.productType === "sugar-cookies" && !value.cookieCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cookieCount"],
        message: "Cookie quantity is required.",
      });
    }

    if (value.productType === "macarons" && !value.macaronCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["macaronCount"],
        message: "Macaron quantity is required.",
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

export const inquirySchema = z.object({
  eventType: z.string().min(2).max(80),
  eventDate: z.string().min(4),
  eventTime: z.string().max(40).optional(),
  guestCount: z.coerce.number().int().min(1).max(1000).optional(),
  servingTarget: z.coerce.number().int().min(1).max(1000).optional(),
  venueName: z.string().max(120).optional(),
  venueAddress: z.string().max(220).optional(),
  fulfillmentMethod: z.enum(["pickup", "delivery"]),
  budgetMin: z.coerce.number().int().min(0).max(10000).optional(),
  budgetMax: z.coerce.number().int().min(0).max(10000).optional(),
  deliveryWindow: z.string().max(80).optional(),
  colorPalette: z.string().max(160).optional(),
  dietaryNotes: z.string().max(800).optional(),
  orderItems: z.array(inquiryItemSchema).min(1),
  inspirationFiles: z
    .array(
      z.object({
        path: z.string().min(1),
        url: z.string().url().optional(),
        name: z.string().min(1),
      }),
    )
    .default([]),
  inspirationLinks: z.array(z.string().url()).default([]),
  inspirationText: z.string().max(1200).optional(),
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7).max(30),
  instagramHandle: z.string().max(60).optional(),
  preferredContact: z.enum(["email", "text", "phone"]),
  howDidYouHear: z.string().max(120).optional(),
  additionalNotes: z.string().max(2000).optional(),
});

export type InquiryFormValues = z.infer<typeof inquirySchema>;
