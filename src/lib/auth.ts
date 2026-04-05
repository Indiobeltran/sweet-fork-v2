import { redirect } from "next/navigation";

import type { AdminRole } from "@/types/domain";
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

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id, email, full_name, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminUser) {
    return null;
  }

  return {
    id: adminUser.id as string,
    email: adminUser.email as string,
    fullName: adminUser.full_name as string,
    role: adminUser.role as AdminRole,
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
