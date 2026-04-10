import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/components/admin/admin-nav";
import { signOutAdmin } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen pb-10 pt-4 sm:pt-6">
      <div className="section-shell">
        <div className="grain-surface overflow-hidden rounded-[2.2rem] border border-charcoal/10 bg-paper px-5 py-5 shadow-soft sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Admin desk</Badge>
                <span className="rounded-full border border-charcoal/10 bg-white/82 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/55">
                  Signed in as {admin.role}
                </span>
              </div>
              <div>
                <h1 className="font-serif text-3xl tracking-[-0.04em] text-charcoal sm:text-4xl">
                  Bakery operations
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-charcoal/66">
                  Jump between the live bakery queues, update records, and keep the calendar within
                  reach without digging through oversized page chrome.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-full border border-charcoal/10 bg-white/82 px-4 py-3 text-sm text-charcoal/72">
                <span className="font-medium text-charcoal">{admin.fullName || admin.email}</span>
              </div>
              <form action={signOutAdmin}>
                <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className="sticky top-3 z-30 mt-4">
          <AdminNav />
        </div>

        <div className="pt-6">{children}</div>
      </div>
    </div>
  );
}
