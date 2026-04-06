"use server";

import { requireAdmin } from "@/lib/auth";
import {
  getSafeRedirectTarget,
  parseBoolean,
  parseInteger,
  parseRequiredString,
  redirectWithNotice,
  revalidatePaths,
} from "@/lib/admin/action-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert, TablesUpdate } from "@/types/supabase.generated";

const faqRedirectPath = "/admin/faqs";

function getFaqRedirectTarget(value: FormDataEntryValue | null) {
  return getSafeRedirectTarget(value, faqRedirectPath, faqRedirectPath);
}

export async function createFaqItem(formData: FormData) {
  await requireAdmin();

  const redirectTarget = getFaqRedirectTarget(formData.get("redirectTo"));
  const question = parseRequiredString(formData.get("question"));
  const answer = parseRequiredString(formData.get("answer"));
  const categoryKey = parseRequiredString(formData.get("categoryKey"));
  const displayOrder = parseInteger(formData.get("displayOrder"));
  const isPublished = parseBoolean(formData.get("isPublished"));

  if (question.length < 4 || answer.length < 8 || categoryKey.length < 2) {
    redirectWithNotice(redirectTarget, "faq-error");
  }

  const supabase = createAdminClient();
  const payload: TablesInsert<"faq_items"> = {
    answer,
    category_key: categoryKey,
    display_order: displayOrder,
    is_published: isPublished,
    question,
  };
  const { error } = await supabase.from("faq_items").insert(payload);

  if (error) {
    console.error("Unable to create FAQ item.", error);
    redirectWithNotice(redirectTarget, "faq-error");
  }

  revalidatePaths([faqRedirectPath, "/faq"]);
  redirectWithNotice(redirectTarget, "faq-created");
}

export async function updateFaqItem(formData: FormData) {
  await requireAdmin();

  const faqId = parseRequiredString(formData.get("faqId"));
  const redirectTarget = getFaqRedirectTarget(formData.get("redirectTo"));
  const question = parseRequiredString(formData.get("question"));
  const answer = parseRequiredString(formData.get("answer"));
  const categoryKey = parseRequiredString(formData.get("categoryKey"));
  const displayOrder = parseInteger(formData.get("displayOrder"));
  const isPublished = parseBoolean(formData.get("isPublished"));

  if (!faqId || question.length < 4 || answer.length < 8 || categoryKey.length < 2) {
    redirectWithNotice(redirectTarget, "faq-error");
  }

  const supabase = createAdminClient();
  const payload: TablesUpdate<"faq_items"> = {
    answer,
    category_key: categoryKey,
    display_order: displayOrder,
    is_published: isPublished,
    question,
  };
  const { error } = await supabase.from("faq_items").update(payload).eq("id", faqId);

  if (error) {
    console.error("Unable to update FAQ item.", error);
    redirectWithNotice(redirectTarget, "faq-error");
  }

  revalidatePaths([faqRedirectPath, "/faq"]);
  redirectWithNotice(redirectTarget, "faq-updated");
}

export async function deleteFaqItem(formData: FormData) {
  await requireAdmin();

  const faqId = parseRequiredString(formData.get("faqId"));
  const redirectTarget = getFaqRedirectTarget(formData.get("redirectTo"));

  if (!faqId) {
    redirectWithNotice(redirectTarget, "faq-error");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("faq_items").delete().eq("id", faqId);

  if (error) {
    console.error("Unable to delete FAQ item.", error);
    redirectWithNotice(redirectTarget, "faq-error");
  }

  revalidatePaths([faqRedirectPath, "/faq"]);
  redirectWithNotice(redirectTarget, "faq-deleted");
}
