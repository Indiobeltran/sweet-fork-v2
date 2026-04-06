"use server";

import { requireAdmin } from "@/lib/auth";
import {
  getSafeRedirectTarget,
  parseBoolean,
  parseNumber,
  parseOptionalString,
  parseRequiredString,
  redirectWithNotice,
  revalidateMarketingSite,
  revalidatePaths,
} from "@/lib/admin/action-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert, TablesUpdate } from "@/types/supabase.generated";

const pricingRedirectPath = "/admin/pricing";

function getPricingRedirectTarget(value: FormDataEntryValue | null) {
  return getSafeRedirectTarget(value, pricingRedirectPath, pricingRedirectPath);
}

function getExpectedPriceKinds(productType: string) {
  if (productType === "custom-cake" || productType === "wedding-cake") {
    return ["base", "per-serving"] as const;
  }

  return ["base", "per-unit"] as const;
}

export async function upsertProductPricing(formData: FormData) {
  await requireAdmin();

  const productId = parseRequiredString(formData.get("productId"));
  const productType = parseRequiredString(formData.get("productType"));
  const redirectTarget = getPricingRedirectTarget(formData.get("redirectTo"));

  if (!productId || !productType) {
    redirectWithNotice(redirectTarget, "pricing-error");
  }

  const supabase = createAdminClient();

  try {
    for (const kind of getExpectedPriceKinds(productType)) {
      const minimumAmount = parseNumber(formData.get(`minimumAmount.${kind}`));
      const maximumAmount = parseNumber(formData.get(`maximumAmount.${kind}`));
      const label = parseRequiredString(formData.get(`label.${kind}`));
      const notes = parseOptionalString(formData.get(`notes.${kind}`));
      const unitLabel = parseOptionalString(formData.get(`unitLabel.${kind}`));
      const isActive = parseBoolean(formData.get(`isActive.${kind}`));
      const priceId = parseOptionalString(formData.get(`priceId.${kind}`));

      if (minimumAmount === null || label.length < 2) {
        throw new Error(`Missing pricing details for ${kind}.`);
      }

      if (priceId) {
        const update: TablesUpdate<"product_prices"> = {
          is_active: isActive,
          label,
          maximum_amount: maximumAmount ?? minimumAmount,
          minimum_amount: minimumAmount,
          notes,
          unit_label: unitLabel,
        };
        const { error } = await supabase.from("product_prices").update(update).eq("id", priceId);

        if (error) {
          throw error;
        }
      } else {
        const insert: TablesInsert<"product_prices"> = {
          is_active: isActive,
          label,
          maximum_amount: maximumAmount ?? minimumAmount,
          minimum_amount: minimumAmount,
          notes,
          price_kind: kind,
          product_id: productId,
          unit_label: unitLabel,
        };
        const { error } = await supabase.from("product_prices").insert(insert);

        if (error) {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error("Unable to update product pricing.", error);
    redirectWithNotice(redirectTarget, "pricing-error");
  }

  revalidatePaths([pricingRedirectPath, "/admin/products"]);
  revalidateMarketingSite(["/pricing", "/start-order", "/"]);
  redirectWithNotice(redirectTarget, "pricing-updated");
}
