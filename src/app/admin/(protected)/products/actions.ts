"use server";

import { requireAdmin } from "@/lib/auth";
import {
  getSafeRedirectTarget,
  parseBoolean,
  parseInteger,
  parseOptionalString,
  parseRequiredString,
  redirectWithNotice,
  revalidateMarketingSite,
  revalidatePaths,
} from "@/lib/admin/action-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesUpdate } from "@/types/supabase.generated";

const productsRedirectPath = "/admin/products";

function getProductsRedirectTarget(value: FormDataEntryValue | null) {
  return getSafeRedirectTarget(value, productsRedirectPath, productsRedirectPath);
}

export async function updateProduct(formData: FormData) {
  await requireAdmin();

  const productId = parseRequiredString(formData.get("productId"));
  const redirectTarget = getProductsRedirectTarget(formData.get("redirectTo"));
  const name = parseRequiredString(formData.get("name"));
  const shortDescription = parseOptionalString(formData.get("shortDescription"));
  const longDescription = parseOptionalString(formData.get("longDescription"));
  const displayOrder = parseInteger(formData.get("displayOrder"));
  const requiresConsultation = parseBoolean(formData.get("requiresConsultation"));
  const isActive = parseBoolean(formData.get("isActive"));

  if (!productId || name.length < 2) {
    redirectWithNotice(redirectTarget, "product-error");
  }

  const supabase = createAdminClient();
  const payload: TablesUpdate<"products"> = {
    display_order: displayOrder,
    is_active: isActive,
    long_description: longDescription,
    name,
    requires_consultation: requiresConsultation,
    short_description: shortDescription,
  };
  const { error } = await supabase.from("products").update(payload).eq("id", productId);

  if (error) {
    console.error("Unable to update product.", error);
    redirectWithNotice(redirectTarget, "product-error");
  }

  revalidatePaths([productsRedirectPath, "/admin/pricing"]);
  revalidateMarketingSite();
  redirectWithNotice(redirectTarget, "product-updated");
}
