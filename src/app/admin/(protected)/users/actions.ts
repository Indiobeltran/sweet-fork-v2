"use server";

import { requireAdmin } from "@/lib/auth";
import {
  getSafeRedirectTarget,
  parseRequiredString,
  redirectWithNotice,
  revalidatePaths,
} from "@/lib/admin/action-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { Constants, type Enums } from "@/types/supabase.generated";

export async function updateAdminUserRole(formData: FormData) {
  const admin = await requireAdmin(["owner"]);

  const userId = parseRequiredString(formData.get("userId"));
  const nextRole = parseRequiredString(formData.get("role"));
  const redirectTarget = getSafeRedirectTarget(formData.get("redirectTo"), "/admin/users", "/admin/users");

  if (!userId) {
    redirectWithNotice(redirectTarget, "users-error");
  }

  if (!Constants.public.Enums.admin_role.includes(nextRole as Enums<"admin_role">)) {
    redirectWithNotice(redirectTarget, "users-error");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("user_roles").select("id, role, user_id");

  if (error || !data) {
    console.error("Unable to load user roles for update.", error);
    redirectWithNotice(redirectTarget, "users-error");
  }

  const rows = data as Array<{ id: string; role: Enums<"admin_role">; user_id: string }>;
  const targetRow = rows.find((row) => row.user_id === userId);
  const ownerCount = rows.filter((row) => row.role === "owner").length;

  if (!targetRow) {
    redirectWithNotice(redirectTarget, "users-error");
  }

  if (targetRow.role === "owner" && nextRole !== "owner" && ownerCount <= 1) {
    redirectWithNotice(redirectTarget, "users-error");
  }

  const { error: updateError } = await supabase
    .from("user_roles")
    .update({
      granted_by: admin.id,
      role: nextRole as Enums<"admin_role">,
    })
    .eq("id", targetRow.id);

  if (updateError) {
    console.error("Unable to update admin role.", updateError);
    redirectWithNotice(redirectTarget, "users-error");
  }

  revalidatePaths(["/admin/users"]);
  redirectWithNotice(redirectTarget, "users-updated");
}
