import "server-only";

import {
  getBudgetFlexibilityLabel,
  getBudgetRangeLabel,
  resolveBudgetRangeValues,
} from "@/lib/inquiries/config";
import { getCatalogMap, getProductName, getStartOrderPageData } from "@/lib/inquiries/catalog";
import { estimateInquiry, getProductDisplayLabel, getStoredItemQuantity } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  inquirySchema,
  normalizeInquiryFormValues,
  validateInspirationUploads,
  type InquiryFormValues,
} from "@/lib/validations/inquiry";
import { siteConfig } from "@/lib/content/site-content";
import { isSupabaseConfigured } from "@/lib/env";
import { formatCurrency } from "@/lib/utils";
import type { InquiryEstimate, InquiryProductItem } from "@/types/domain";
import type { TablesInsert } from "@/types/supabase.generated";

type SubmissionCleanup = {
  inquiryId: string;
  mediaAssetIds: string[];
  storagePaths: string[];
};

export class InquirySubmissionError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "InquirySubmissionError";
    this.status = status;
  }
}

export type InquirySubmissionResult = {
  inquiryId: string;
  referenceCode: string;
  uploadedAssetCount: number;
};

function slugifySegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function getReferenceCode(inquiryId: string) {
  return `SF-${inquiryId.slice(0, 8).toUpperCase()}`;
}

function describeItem(item: InquiryProductItem) {
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

function buildSignals(
  values: InquiryFormValues,
  estimate: InquiryEstimate,
  uploadCount: number,
) {
  const eventDate = new Date(`${values.eventDate}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const daysUntilEvent = Math.ceil(
    (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const inspirationSignals =
    uploadCount +
    values.inspirationLinks.length +
    (values.inspirationText ? 1 : 0);
  const detailedItems = values.orderItems.filter(
    (item) =>
      Boolean(item.designNotes) ||
      Boolean(item.flavorNotes) ||
      Boolean(item.colorPalette) ||
      Boolean(item.topperText),
  ).length;

  const clarity =
    inspirationSignals >= 2 && detailedItems === values.orderItems.length
      ? "high"
      : inspirationSignals > 0 || detailedItems > 0
        ? "medium"
        : "low";

  const priority =
    values.orderItems.some((item) => item.productType === "wedding-cake") ||
    values.orderItems.length >= 3 ||
    estimate.maximum >= 1000
      ? "high"
      : "standard";

  const urgency =
    daysUntilEvent <= 7 ? "rush" : daysUntilEvent <= 21 ? "soon" : "standard";

  return {
    clarity,
    priority,
    urgency,
    daysUntilEvent,
  };
}

function buildInternalSummary(
  values: InquiryFormValues,
  estimate: InquiryEstimate,
  referenceCode: string,
  signals: ReturnType<typeof buildSignals>,
) {
  const itemSummary = values.orderItems
    .map((item) => `${getProductDisplayLabel(item.productType)}: ${describeItem(item)}`)
    .join("; ");

  return [
    `${referenceCode} submitted from the Start Order wizard.`,
    `${values.eventType} on ${values.eventDate} via ${values.fulfillmentMethod}.`,
    `Budget: ${getBudgetRangeLabel(values.budgetRange)} (${getBudgetFlexibilityLabel(values.budgetFlexibility)}).`,
    `Estimated range: ${formatCurrency(estimate.minimum)} to ${formatCurrency(estimate.maximum)}.`,
    `Items: ${itemSummary}.`,
    `Signals: clarity ${signals.clarity}, priority ${signals.priority}, urgency ${signals.urgency}.`,
  ].join(" ");
}

async function ensureStorageBucket(bucket: string) {
  const admin = createAdminClient();
  const { data: existingBucket } = await admin.storage.getBucket(bucket);

  if (existingBucket) {
    return;
  }

  const { error } = await admin.storage.createBucket(bucket, {
    public: false,
  });

  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw error;
  }
}

async function cleanupFailedSubmission(
  bucket: string,
  cleanup: SubmissionCleanup,
) {
  const admin = createAdminClient();

  if (cleanup.storagePaths.length > 0) {
    await admin.storage.from(bucket).remove(cleanup.storagePaths);
  }

  if (cleanup.mediaAssetIds.length > 0) {
    await admin.from("media_assets").delete().in("id", cleanup.mediaAssetIds);
  }

  await admin.from("inquiries").delete().eq("id", cleanup.inquiryId);
}

function getStoragePath(inquiryId: string, file: File) {
  const extension = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    : "";
  const safeName = slugifySegment(file.name.replace(/\.[^.]+$/, "")) || "inspiration";

  return `inquiries/${inquiryId}/${crypto.randomUUID()}-${safeName}${extension}`;
}

export async function submitInquiry(
  rawValues: unknown,
  files: File[],
): Promise<InquirySubmissionResult> {
  if (!isSupabaseConfigured()) {
    throw new InquirySubmissionError(
      "Inquiry submission is temporarily unavailable. Please try again shortly.",
      503,
    );
  }

  const values = normalizeInquiryFormValues(rawValues);
  const parsed = inquirySchema.safeParse(values);

  if (!parsed.success) {
    throw new InquirySubmissionError(
      parsed.error.issues[0]?.message ?? "Please review the inquiry details.",
    );
  }

  const { catalog, featureFlags, pricingBaseline, deliveryRange } =
    await getStartOrderPageData();
  const uploadIssues = validateInspirationUploads(files, featureFlags);

  if (uploadIssues.length > 0) {
    throw new InquirySubmissionError(uploadIssues[0]);
  }

  const catalogMap = getCatalogMap(catalog);
  const estimate = estimateInquiry(parsed.data, {
    pricing: pricingBaseline,
    deliveryRange,
  });
  const signals = buildSignals(parsed.data, estimate, files.length);
  const budgetRange = resolveBudgetRangeValues(parsed.data.budgetRange);
  const inquiryId = crypto.randomUUID();
  const referenceCode = getReferenceCode(inquiryId);
  const cleanup: SubmissionCleanup = {
    inquiryId,
    mediaAssetIds: [],
    storagePaths: [],
  };
  const admin = createAdminClient();

  try {
    const inquiryInsert: TablesInsert<"inquiries"> = {
      id: inquiryId,
      source_channel: "web",
      status: "new",
      customer_name: parsed.data.customerName,
      customer_email: parsed.data.customerEmail,
      customer_phone: parsed.data.customerPhone,
      instagram_handle: parsed.data.instagramHandle ?? null,
      preferred_contact: parsed.data.preferredContact,
      how_did_you_hear: parsed.data.howDidYouHear ?? null,
      event_type: parsed.data.eventType,
      event_date: parsed.data.eventDate,
      guest_count: parsed.data.guestCount ?? null,
      serving_target: parsed.data.guestCount ?? null,
      fulfillment_method: parsed.data.fulfillmentMethod,
      budget_min: budgetRange.minimum,
      budget_max: budgetRange.maximum,
      color_palette: parsed.data.colorPalette ?? null,
      additional_notes: parsed.data.additionalNotes ?? null,
      inspiration_text: parsed.data.inspirationText ?? null,
      internal_summary: buildInternalSummary(parsed.data, estimate, referenceCode, signals),
      estimated_min: estimate.minimum,
      estimated_max: estimate.maximum,
      metadata: {
        source: "start-order-wizard",
        referenceCode,
        deliveryZip: parsed.data.deliveryZip ?? null,
        budgetRange: parsed.data.budgetRange,
        budgetRangeLabel: getBudgetRangeLabel(parsed.data.budgetRange),
        budgetFlexibility: parsed.data.budgetFlexibility,
        budgetFlexibilityLabel: getBudgetFlexibilityLabel(
          parsed.data.budgetFlexibility,
        ),
        placeholderSignals: signals,
        uploadCount: files.length,
        linkCount: parsed.data.inspirationLinks.length,
      },
    };

    const { error: inquiryError } = await admin.from("inquiries").insert(inquiryInsert);

    if (inquiryError) {
      throw inquiryError;
    }

    const itemRows: TablesInsert<"inquiry_items">[] = parsed.data.orderItems.map(
      (item, index) => {
        const itemEstimate = estimate.lineItems.find(
          (lineItem) => lineItem.productType === item.productType,
        );

        return {
          inquiry_id: inquiryId,
          product_id: catalogMap[item.productType]?.id ?? null,
          product_type: item.productType,
          product_label: getProductName(catalogMap, item.productType),
          quantity: getStoredItemQuantity(item),
          sort_order: index,
          servings: item.servings ?? null,
          flavor_notes: item.flavorNotes ?? null,
          design_notes: item.designNotes ?? null,
          inspiration_notes: item.inspirationNotes ?? null,
          size_label: item.sizeLabel ?? null,
          tiers: item.tiers ?? null,
          shape: item.shape ?? null,
          icing_style: item.icingStyle ?? null,
          cupcake_count: item.cupcakeCount ?? null,
          cookie_count: item.cookieCount ?? null,
          macaron_count: item.macaronCount ?? null,
          kit_count: item.kitCount ?? null,
          wedding_servings: item.weddingServings ?? null,
          topper_text: item.topperText ?? null,
          color_palette: item.colorPalette ?? null,
          estimated_min: itemEstimate?.minimum ?? null,
          estimated_max: itemEstimate?.maximum ?? null,
          detail_json: {
            source: "start-order-wizard",
            requestedSummary: describeItem(item),
            lineItemRange: itemEstimate
              ? {
                  minimum: itemEstimate.minimum,
                  maximum: itemEstimate.maximum,
                }
              : null,
          },
        };
      },
    );

    const { error: itemsError } = await admin.from("inquiry_items").insert(itemRows);

    if (itemsError) {
      throw itemsError;
    }

    if (files.length > 0) {
      await ensureStorageBucket(featureFlags.storageBucket);

      for (const [index, file] of files.entries()) {
        const mediaAssetId = crypto.randomUUID();
        const storagePath = getStoragePath(inquiryId, file);
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        cleanup.mediaAssetIds.push(mediaAssetId);
        cleanup.storagePaths.push(storagePath);

        const { error: uploadError } = await admin.storage
          .from(featureFlags.storageBucket)
          .upload(storagePath, fileBuffer, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const mediaAssetInsert: TablesInsert<"media_assets"> = {
          id: mediaAssetId,
          bucket: featureFlags.storageBucket,
          storage_path: storagePath,
          public_url: null,
          asset_kind: "image",
          source_kind: "upload",
          mime_type: file.type,
          original_filename: file.name,
          file_size_bytes: file.size,
          metadata: {
            inquiryId,
            referenceCode,
            source: "start-order-wizard",
          },
        };

        const { error: mediaAssetError } = await admin
          .from("media_assets")
          .insert(mediaAssetInsert);

        if (mediaAssetError) {
          throw mediaAssetError;
        }

        const inquiryAssetInsert: TablesInsert<"inquiry_assets"> = {
          inquiry_id: inquiryId,
          asset_type: "image-upload",
          media_asset_id: mediaAssetId,
          label: file.name,
          sort_order: index,
          metadata: {
            source: "start-order-wizard",
            storageBucket: featureFlags.storageBucket,
          },
        };

        const { error: inquiryAssetError } = await admin
          .from("inquiry_assets")
          .insert(inquiryAssetInsert);

        if (inquiryAssetError) {
          throw inquiryAssetError;
        }
      }
    }

    const referenceAssets: TablesInsert<"inquiry_assets">[] = [
      ...parsed.data.inspirationLinks.map((link, index) => ({
        inquiry_id: inquiryId,
        asset_type: "reference-link" as const,
        external_url: link,
        label: `Reference link ${index + 1}`,
        sort_order: files.length + index,
        metadata: {
          source: "start-order-wizard",
        },
      })),
      ...(parsed.data.inspirationText
        ? [
            {
              inquiry_id: inquiryId,
              asset_type: "reference-text" as const,
              text_content: parsed.data.inspirationText,
              label: "Inspiration notes",
              sort_order: files.length + parsed.data.inspirationLinks.length,
              metadata: {
                source: "start-order-wizard",
              },
            } satisfies TablesInsert<"inquiry_assets">,
          ]
        : []),
    ];

    if (referenceAssets.length > 0) {
      const { error: referenceAssetError } = await admin
        .from("inquiry_assets")
        .insert(referenceAssets);

      if (referenceAssetError) {
        throw referenceAssetError;
      }
    }

    const notificationEvent: TablesInsert<"notification_events"> = {
      event_key: "inquiry.submitted.web",
      category_key: "inquiry",
      description: "Recorded when a new public inquiry is submitted from the Start Order wizard.",
      default_channels: ["internal"],
      template_key: "inquiry-submitted-web",
      is_active: true,
    };

    const { data: notificationEventRow, error: notificationEventError } = await admin
      .from("notification_events")
      .upsert(notificationEvent, {
        onConflict: "event_key",
      })
      .select("id")
      .single();

    if (notificationEventError) {
      throw notificationEventError;
    }

    const notificationLog: TablesInsert<"notification_logs"> = {
      notification_event_id: notificationEventRow.id,
      inquiry_id: inquiryId,
      channel: "internal",
      status: "pending",
      recipient: siteConfig.email,
      subject: `New inquiry ${referenceCode} from ${parsed.data.customerName}`,
      payload: {
        inquiryId,
        referenceCode,
        customerName: parsed.data.customerName,
        eventType: parsed.data.eventType,
        eventDate: parsed.data.eventDate,
        estimatedRange: {
          minimum: estimate.minimum,
          maximum: estimate.maximum,
        },
        placeholderSignals: signals,
      },
    };

    const { error: notificationLogError } = await admin
      .from("notification_logs")
      .insert(notificationLog);

    if (notificationLogError) {
      throw notificationLogError;
    }

    return {
      inquiryId,
      referenceCode,
      uploadedAssetCount: files.length,
    };
  } catch (error) {
    await cleanupFailedSubmission(featureFlags.storageBucket, cleanup).catch(() => undefined);

    if (error instanceof InquirySubmissionError) {
      throw error;
    }

    throw new InquirySubmissionError(
      "We could not submit the inquiry right now. Please try again in a few minutes.",
      500,
    );
  }
}
