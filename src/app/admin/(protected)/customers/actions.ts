"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import {
  getSafeRedirectTarget,
  parseOptionalString,
  parseRequiredString,
  redirectWithNotice,
} from "@/lib/admin/action-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Constants,
  type Enums,
  type TablesUpdate,
} from "@/types/supabase.generated";

function getSafeCustomerRedirectTarget(value: FormDataEntryValue | null, customerId?: string) {
  return getSafeRedirectTarget(
    value,
    "/admin/customers",
    customerId ? `/admin/customers/${customerId}` : "/admin/customers",
  );
}

export async function updateCustomerDetails(formData: FormData) {
  await requireAdmin();

  const customerId = parseRequiredString(formData.get("customerId"));
  const redirectTarget = getSafeCustomerRedirectTarget(formData.get("redirectTo"), customerId);
  const fullName = parseRequiredString(formData.get("fullName"));
  const email = parseOptionalString(formData.get("email"));
  const phone = parseOptionalString(formData.get("phone"));
  const instagramHandle = parseOptionalString(formData.get("instagramHandle"));
  const preferredContact = parseRequiredString(formData.get("preferredContact"));
  const defaultFulfillmentMethod = parseOptionalString(formData.get("defaultFulfillmentMethod"));
  const leadSource = parseOptionalString(formData.get("leadSource"));
  const notes = parseOptionalString(formData.get("notes"));

  if (!customerId || fullName.length < 2) {
    redirectWithNotice(redirectTarget, "customer-error");
  }

  if (
    !Constants.public.Enums.contact_preference.includes(
      preferredContact as Enums<"contact_preference">,
    )
  ) {
    redirectWithNotice(redirectTarget, "customer-error");
  }

  if (
    defaultFulfillmentMethod &&
    !Constants.public.Enums.fulfillment_method.includes(
      defaultFulfillmentMethod as Enums<"fulfillment_method">,
    )
  ) {
    redirectWithNotice(redirectTarget, "customer-error");
  }

  const supabase = createAdminClient();
  const update: TablesUpdate<"customers"> = {
    default_fulfillment_method: defaultFulfillmentMethod as Enums<"fulfillment_method"> | null,
    email,
    full_name: fullName,
    instagram_handle: instagramHandle,
    lead_source: leadSource,
    notes,
    phone,
    preferred_contact: preferredContact as Enums<"contact_preference">,
  };

  const { error } = await supabase.from("customers").update(update).eq("id", customerId);

  if (error) {
    redirectWithNotice(redirectTarget, "customer-error");
  }

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/orders");
  redirectWithNotice(redirectTarget, "customer-updated");
}
