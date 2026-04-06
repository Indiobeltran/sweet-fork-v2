"use server";

import { requireAdmin } from "@/lib/auth";
import {
  getSafeRedirectTarget,
  parseBoolean,
  parseInteger,
  parseOptionalString,
  parseRequiredString,
  redirectWithNotice,
  revalidatePaths,
} from "@/lib/admin/action-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert, TablesUpdate } from "@/types/supabase.generated";

const testimonialRedirectPath = "/admin/testimonials";

function getTestimonialRedirectTarget(value: FormDataEntryValue | null) {
  return getSafeRedirectTarget(value, testimonialRedirectPath, testimonialRedirectPath);
}

export async function createTestimonial(formData: FormData) {
  await requireAdmin();

  const redirectTarget = getTestimonialRedirectTarget(formData.get("redirectTo"));
  const attributionName = parseRequiredString(formData.get("attributionName"));
  const attributionRole = parseOptionalString(formData.get("attributionRole"));
  const sourceLabel = parseOptionalString(formData.get("sourceLabel"));
  const quote = parseRequiredString(formData.get("quote"));
  const displayOrder = parseInteger(formData.get("displayOrder"));
  const isFeatured = parseBoolean(formData.get("isFeatured"));
  const isPublished = parseBoolean(formData.get("isPublished"));

  if (attributionName.length < 2 || quote.length < 12) {
    redirectWithNotice(redirectTarget, "testimonial-error");
  }

  const supabase = createAdminClient();
  const payload: TablesInsert<"testimonials"> = {
    attribution_name: attributionName,
    attribution_role: attributionRole,
    display_order: displayOrder,
    is_featured: isFeatured,
    is_published: isPublished,
    quote,
    source_label: sourceLabel,
  };
  const { error } = await supabase.from("testimonials").insert(payload);

  if (error) {
    console.error("Unable to create testimonial.", error);
    redirectWithNotice(redirectTarget, "testimonial-error");
  }

  revalidatePaths([testimonialRedirectPath, "/"]);
  redirectWithNotice(redirectTarget, "testimonial-created");
}

export async function updateTestimonial(formData: FormData) {
  await requireAdmin();

  const testimonialId = parseRequiredString(formData.get("testimonialId"));
  const redirectTarget = getTestimonialRedirectTarget(formData.get("redirectTo"));
  const attributionName = parseRequiredString(formData.get("attributionName"));
  const attributionRole = parseOptionalString(formData.get("attributionRole"));
  const sourceLabel = parseOptionalString(formData.get("sourceLabel"));
  const quote = parseRequiredString(formData.get("quote"));
  const displayOrder = parseInteger(formData.get("displayOrder"));
  const isFeatured = parseBoolean(formData.get("isFeatured"));
  const isPublished = parseBoolean(formData.get("isPublished"));

  if (!testimonialId || attributionName.length < 2 || quote.length < 12) {
    redirectWithNotice(redirectTarget, "testimonial-error");
  }

  const supabase = createAdminClient();
  const payload: TablesUpdate<"testimonials"> = {
    attribution_name: attributionName,
    attribution_role: attributionRole,
    display_order: displayOrder,
    is_featured: isFeatured,
    is_published: isPublished,
    quote,
    source_label: sourceLabel,
  };
  const { error } = await supabase.from("testimonials").update(payload).eq("id", testimonialId);

  if (error) {
    console.error("Unable to update testimonial.", error);
    redirectWithNotice(redirectTarget, "testimonial-error");
  }

  revalidatePaths([testimonialRedirectPath, "/"]);
  redirectWithNotice(redirectTarget, "testimonial-updated");
}

export async function deleteTestimonial(formData: FormData) {
  await requireAdmin();

  const testimonialId = parseRequiredString(formData.get("testimonialId"));
  const redirectTarget = getTestimonialRedirectTarget(formData.get("redirectTo"));

  if (!testimonialId) {
    redirectWithNotice(redirectTarget, "testimonial-error");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("testimonials").delete().eq("id", testimonialId);

  if (error) {
    console.error("Unable to delete testimonial.", error);
    redirectWithNotice(redirectTarget, "testimonial-error");
  }

  revalidatePaths([testimonialRedirectPath, "/"]);
  redirectWithNotice(redirectTarget, "testimonial-deleted");
}
