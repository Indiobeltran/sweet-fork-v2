import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { signOutAdmin } from "@/app/admin/actions";

export default async function AdminProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen pb-10 pt-6 sm:pt-8">
      <div className="section-shell">
        <div className="grain-surface overflow-hidden rounded-[2.4rem] border border-charcoal/10 bg-paper px-6 py-6 shadow-soft sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge>Admin Inquiry Desk</Badge>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                  Signed in as {admin.role}
                </p>
                <h1 className="mt-2 font-serif text-4xl tracking-[-0.04em] text-charcoal sm:text-5xl">
                  Keep inquiries warm, clear, and easy to follow.
                </h1>
              </div>
              <p className="max-w-3xl text-sm leading-7 text-charcoal/66">
                This phase covers inquiry review only: list filters, full inquiry detail, internal
                notes, status changes, and a placeholder for order conversion.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-full border border-charcoal/10 bg-white/80 px-4 py-3 text-sm text-charcoal/72">
                <span className="font-medium text-charcoal">{admin.fullName || admin.email}</span>
              </div>
              <form action={signOutAdmin}>
                <Button type="submit" variant="secondary">
                  Sign out
                </Button>
              </form>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/inquiries"
              className="rounded-full border border-charcoal/12 bg-white px-4 py-2 text-sm font-medium text-charcoal transition hover:border-charcoal/30"
            >
              Inquiries
            </Link>
            <span className="rounded-full border border-charcoal/8 bg-white/70 px-4 py-2 text-sm text-charcoal/55">
              More admin modules will arrive in later phases
            </span>
          </div>
        </div>

        <div className="pt-6">{children}</div>
      </div>
    </div>
  );
}
