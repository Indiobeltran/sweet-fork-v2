import "server-only";

import { createClient as createSessionClient } from "@/lib/supabase/server";
import type { Enums, Tables } from "@/types/supabase.generated";

type ProfileRow = Tables<"profiles">;
type UserRoleRow = Tables<"user_roles">;

export type AdminUserEntry = {
  email: string;
  fullName: string;
  grantedAt: string;
  grantedByLabel: string | null;
  isActive: boolean;
  lastSignInAt: string | null;
  phone: string | null;
  role: Enums<"admin_role">;
  timezone: string;
  userId: string;
};

export type ProfileWithoutAdminEntry = {
  email: string;
  fullName: string;
  id: string;
  isActive: boolean;
  lastSignInAt: string | null;
  timezone: string;
};

export type UsersAdminData = {
  adminUsers: AdminUserEntry[];
  profilesWithoutAdmin: ProfileWithoutAdminEntry[];
  summary: Array<{
    detail: string;
    label: string;
    value: string;
  }>;
};

export const adminRoleGuide: Array<{
  detail: string;
  role: Enums<"admin_role">;
  title: string;
}> = [
  {
    role: "owner",
    title: "Owner",
    detail:
      "Owners can manage access, adjust roles, and handle launch-critical settings. Keep this list short.",
  },
  {
    role: "manager",
    title: "Manager",
    detail:
      "Managers can operate the bakery desk day to day without carrying responsibility for access control decisions.",
  },
];

function buildProfileLabel(profile: Pick<ProfileRow, "email" | "full_name" | "id"> | undefined) {
  if (!profile) {
    return null;
  }

  return profile.full_name?.trim() || profile.email?.trim() || `Profile ${profile.id.slice(0, 8)}`;
}

export async function getUsersAdminData(): Promise<UsersAdminData> {
  const supabase = await createSessionClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for admin users.");
  }

  const [{ data: roleData, error: roleError }, { data: profileData, error: profileError }] =
    await Promise.all([
      supabase.from("user_roles").select("*").order("created_at", { ascending: true }),
      supabase
        .from("profiles")
        .select("id, email, full_name, is_active, last_sign_in_at, phone, timezone")
        .order("full_name", { ascending: true }),
    ]);

  if (roleError) {
    throw roleError;
  }

  if (profileError) {
    throw profileError;
  }

  const roles = (roleData ?? []) as UserRoleRow[];
  const profiles = (profileData ?? []) as Array<
    Pick<ProfileRow, "email" | "full_name" | "id" | "is_active" | "last_sign_in_at" | "phone" | "timezone">
  >;
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const adminUserIds = new Set(roles.map((role) => role.user_id));

  const adminUsers = roles
    .map((role) => {
      const profile = profileMap.get(role.user_id);
      const grantedBy = role.granted_by ? profileMap.get(role.granted_by) : undefined;

      return {
        email: profile?.email ?? "No email on profile",
        fullName: profile?.full_name ?? "Unnamed admin user",
        grantedAt: role.created_at,
        grantedByLabel: buildProfileLabel(grantedBy),
        isActive: profile?.is_active ?? false,
        lastSignInAt: profile?.last_sign_in_at ?? null,
        phone: profile?.phone ?? null,
        role: role.role,
        timezone: profile?.timezone ?? "America/Denver",
        userId: role.user_id,
      } satisfies AdminUserEntry;
    })
    .sort((left, right) => {
      if (left.role === right.role) {
        return left.fullName.localeCompare(right.fullName);
      }

      return left.role === "owner" ? -1 : 1;
    });

  const profilesWithoutAdmin = profiles
    .filter((profile) => !adminUserIds.has(profile.id))
    .map((profile) => ({
      email: profile.email ?? "No email on profile",
      fullName: profile.full_name ?? "Unnamed profile",
      id: profile.id,
      isActive: profile.is_active,
      lastSignInAt: profile.last_sign_in_at,
      timezone: profile.timezone,
    }));

  const ownerCount = adminUsers.filter((user) => user.role === "owner").length;
  const managerCount = adminUsers.filter((user) => user.role === "manager").length;
  const recentlyActiveCount = adminUsers.filter((user) => {
    if (!user.lastSignInAt) {
      return false;
    }

    const lastSignIn = new Date(user.lastSignInAt).getTime();
    const thirtyDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 30;
    return Number.isFinite(lastSignIn) && lastSignIn >= thirtyDaysAgo;
  }).length;

  return {
    adminUsers,
    profilesWithoutAdmin,
    summary: [
      {
        label: "Owners",
        value: String(ownerCount),
        detail:
          ownerCount === 1
            ? "One owner account currently controls access and launch-critical settings."
            : "More than one owner exists, so responsibility is shared.",
      },
      {
        label: "Managers",
        value: String(managerCount),
        detail:
          managerCount === 0
            ? "No manager-only accounts are currently set up."
            : "Manager accounts can operate the desk without taking over access control.",
      },
      {
        label: "Recent sign-ins",
        value: String(recentlyActiveCount),
        detail: "Admin profiles that have signed in within roughly the last 30 days.",
      },
    ],
  };
}
