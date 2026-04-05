import { redirect } from "next/navigation";

import type { AdminRole } from "@/types/domain";
import type { Tables } from "@/types/supabase.generated";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentAdmin() {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: rawProfile }, { data: rawRoleRow }] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
  ]);

  const profile = rawProfile as Pick<Tables<"profiles">, "id" | "email" | "full_name"> | null;
  const roleRow = rawRoleRow as Pick<Tables<"user_roles">, "role"> | null;

  if (!profile || !roleRow) {
    return null;
  }

  return {
    id: profile.id,
    email: profile.email ?? user.email ?? "",
    fullName: profile.full_name ?? user.user_metadata?.full_name ?? "",
    role: roleRow.role as AdminRole,
  };
}

export async function requireAdmin(allowedRoles?: AdminRole[]) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  if (allowedRoles && !allowedRoles.includes(admin.role)) {
    redirect("/admin");
  }

  return admin;
}
