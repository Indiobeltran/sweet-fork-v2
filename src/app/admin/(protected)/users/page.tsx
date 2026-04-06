import { updateAdminUserRole } from "@/app/admin/(protected)/users/actions";
import { AdminNoticeBanner } from "@/components/admin/admin-notice-banner";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { requireAdmin } from "@/lib/auth";
import { formatOptionalDateTime } from "@/lib/admin/order-workflow";
import { adminRoleGuide, getUsersAdminData } from "@/lib/admin/users";
import { toTitleCase } from "@/lib/utils";

export const metadata = {
  title: "Admin Users",
};

type AdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getNoticeValue(rawSearchParams: Record<string, string | string[] | undefined>) {
  const noticeValue = rawSearchParams.notice;
  return Array.isArray(noticeValue) ? noticeValue[0] : noticeValue;
}

function getRoleClasses(role: "manager" | "owner") {
  return role === "owner"
    ? "border-gold/24 bg-gold/12 text-charcoal"
    : "border-charcoal/10 bg-white text-charcoal/74";
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const admin = await requireAdmin();
  const rawSearchParams = await searchParams;
  const [notice, data] = await Promise.all([
    Promise.resolve(getNoticeValue(rawSearchParams)),
    getUsersAdminData(),
  ]);
  const canManageRoles = admin.role === "owner";

  return (
    <div className="space-y-6">
      <AdminNoticeBanner
        notice={notice}
        notices={{
          "users-error": {
            className: "border-rose/24 bg-rose/10 text-charcoal",
            text: "That access change could not be saved. The app keeps at least one owner in place for safety.",
          },
          "users-updated": {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Admin role updated.",
          },
        }}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {data.summary.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.9rem] border border-charcoal/10 bg-white/88 p-5 shadow-soft"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
              {item.label}
            </p>
            <p className="mt-3 font-serif text-4xl tracking-[-0.04em] text-charcoal">
              {item.value}
            </p>
            <p className="mt-2 text-sm leading-7 text-charcoal/62">{item.detail}</p>
          </div>
        ))}
      </section>

      <AdminSectionCard
        title="Role guide"
        description="This pass intentionally keeps access management simple. There is no invitation workflow here yet, just clear visibility into the owner and manager setup that already exists."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          {adminRoleGuide.map((item) => (
            <article
              key={item.role}
              className="rounded-[1.7rem] border border-charcoal/10 bg-paper p-5"
            >
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getRoleClasses(item.role)}`}
              >
                {item.title}
              </span>
              <p className="mt-4 text-sm leading-7 text-charcoal/64">{item.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-[1.6rem] border border-charcoal/10 bg-white/80 px-5 py-4 text-sm leading-7 text-charcoal/64">
          New admin access is still tied to Supabase Auth plus matching <code>profiles</code> and <code>user_roles</code> rows.
          That keeps this launch pass safe and understandable without overbuilding invitations.
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Admin users"
        description="These are the accounts that can currently reach the protected bakery admin. Owners can adjust roles here without needing to open the database."
      >
        <div className="space-y-4">
          {data.adminUsers.map((user) => (
            <article
              key={user.userId}
              className="rounded-[1.8rem] border border-charcoal/10 bg-white/88 p-5 shadow-soft"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getRoleClasses(user.role)}`}
                    >
                      {toTitleCase(user.role)}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${
                        user.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : "border-stone/18 bg-stone/10 text-charcoal"
                      }`}
                    >
                      {user.isActive ? "Active profile" : "Inactive profile"}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-2xl tracking-[-0.03em] text-charcoal">
                      {user.fullName}
                    </h3>
                    <p className="mt-1 text-sm leading-7 text-charcoal/62">{user.email}</p>
                    {user.phone ? <p className="text-sm leading-7 text-charcoal/62">{user.phone}</p> : null}
                  </div>

                  <div className="rounded-[1.4rem] border border-charcoal/8 bg-ivory/70 px-4 py-3 text-sm text-charcoal/66">
                    <p>Timezone: {user.timezone}</p>
                    <p className="mt-2">Last sign-in: {formatOptionalDateTime(user.lastSignInAt)}</p>
                    <p className="mt-2">Role granted: {formatOptionalDateTime(user.grantedAt)}</p>
                    <p className="mt-2">Granted by: {user.grantedByLabel ?? "Not recorded"}</p>
                  </div>
                </div>

                {canManageRoles ? (
                  <form action={updateAdminUserRole} className="w-full max-w-xs space-y-3">
                    <input type="hidden" name="userId" value={user.userId} />
                    <input type="hidden" name="redirectTo" value="/admin/users" />
                    <label className="block text-sm font-medium text-charcoal">
                      Role
                      <Select name="role" defaultValue={user.role} className="mt-2">
                        <option value="owner">Owner</option>
                        <option value="manager">Manager</option>
                      </Select>
                    </label>
                    <Button type="submit" variant="secondary" size="sm">
                      Save role
                    </Button>
                  </form>
                ) : (
                  <div className="rounded-[1.4rem] border border-charcoal/8 bg-paper/70 px-4 py-3 text-sm leading-7 text-charcoal/62 lg:max-w-xs">
                    Role changes are owner-only. Managers can review access here without editing it.
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </AdminSectionCard>

      {data.profilesWithoutAdmin.length > 0 ? (
        <AdminSectionCard
          title="Profiles without admin access"
          description="These profiles exist in the system but do not currently have an owner or manager role."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {data.profilesWithoutAdmin.map((profile) => (
              <article
                key={profile.id}
                className="rounded-[1.6rem] border border-charcoal/10 bg-paper p-5"
              >
                <h3 className="font-medium text-charcoal">{profile.fullName}</h3>
                <p className="mt-1 text-sm leading-7 text-charcoal/62">{profile.email}</p>
                <p className="text-sm leading-7 text-charcoal/62">
                  Last sign-in: {formatOptionalDateTime(profile.lastSignInAt)}
                </p>
                <p className="text-sm leading-7 text-charcoal/62">Timezone: {profile.timezone}</p>
              </article>
            ))}
          </div>
        </AdminSectionCard>
      ) : null}
    </div>
  );
}
