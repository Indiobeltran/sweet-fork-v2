"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Constants,
  type Enums,
  type TablesInsert,
  type TablesUpdate,
} from "@/types/supabase.generated";

function getSafeRedirectTarget(value: FormDataEntryValue | null, inquiryId: string) {
  if (typeof value === "string" && value.startsWith("/admin/inquiries")) {
    return value;
  }

  return `/admin/inquiries/${inquiryId}`;
}

function getSafeListRedirectTarget(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/admin/inquiries")) {
    return "/admin/inquiries";
  }

  const url = new URL(value, "http://localhost");

  return url.pathname === "/admin/inquiries"
    ? `${url.pathname}${url.search}`
    : "/admin/inquiries";
}

function redirectWithNotice(path: string, notice: string): never {
  const url = new URL(path, "http://localhost");
  url.searchParams.set("notice", notice);

  redirect(`${url.pathname}${url.search}`);
}

export async function updateInquiryStatus(formData: FormData) {
  await requireAdmin();

  const inquiryId = String(formData.get("inquiryId") ?? "").trim();
  const nextStatus = String(formData.get("status") ?? "").trim();
  const redirectTarget = getSafeRedirectTarget(formData.get("redirectTo"), inquiryId);

  if (!inquiryId) {
    redirectWithNotice("/admin/inquiries", "status-error");
  }

  if (!Constants.public.Enums.inquiry_status.includes(nextStatus as Enums<"inquiry_status">)) {
    redirectWithNotice(redirectTarget, "status-error");
  }

  const supabase = createAdminClient();

  const { data: currentInquiry, error: currentError } = await supabase
    .from("inquiries")
    .select("archived_at, reviewed_at")
    .eq("id", inquiryId)
    .maybeSingle();

  if (currentError || !currentInquiry) {
    redirectWithNotice(redirectTarget, "status-error");
  }

  const update: TablesUpdate<"inquiries"> = {
    archived_at: nextStatus === "archived" ? new Date().toISOString() : null,
    reviewed_at:
      nextStatus === "new"
        ? currentInquiry.reviewed_at
        : currentInquiry.reviewed_at ?? new Date().toISOString(),
    status: nextStatus as Enums<"inquiry_status">,
  };

  const { error } = await supabase.from("inquiries").update(update).eq("id", inquiryId);

  if (error) {
    redirectWithNotice(redirectTarget, "status-error");
  }

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  redirectWithNotice(redirectTarget, "status-updated");
}

export async function addInquiryNote(formData: FormData) {
  const admin = await requireAdmin();

  const inquiryId = String(formData.get("inquiryId") ?? "").trim();
  const redirectTarget = getSafeRedirectTarget(formData.get("redirectTo"), inquiryId);
  const noteBody = String(formData.get("noteBody") ?? "").trim();
  const isPinned = formData.get("isPinned") === "on";

  if (!inquiryId || noteBody.length === 0) {
    redirectWithNotice(redirectTarget, "note-error");
  }

  const supabase = createAdminClient();
  const noteInsert: TablesInsert<"inquiry_notes"> = {
    author_profile_id: admin.id,
    inquiry_id: inquiryId,
    is_pinned: isPinned,
    note_body: noteBody,
    note_type: "internal",
  };

  const { error } = await supabase.from("inquiry_notes").insert(noteInsert);

  if (error) {
    redirectWithNotice(redirectTarget, "note-error");
  }

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  redirectWithNotice(redirectTarget, "note-added");
}

export async function deleteInquiry(formData: FormData) {
  await requireAdmin(["owner"]);

  const inquiryId = String(formData.get("inquiryId") ?? "").trim();
  const redirectTarget = getSafeListRedirectTarget(formData.get("redirectTo"));

  if (!inquiryId) {
    redirectWithNotice(redirectTarget, "delete-error");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("inquiries").delete().eq("id", inquiryId);

  if (error) {
    redirectWithNotice(redirectTarget, "delete-error");
  }

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  revalidatePath("/admin/orders");
  redirectWithNotice(redirectTarget, "deleted");
}
