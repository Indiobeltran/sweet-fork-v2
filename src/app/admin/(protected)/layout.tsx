import Link from "next/link";

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
    <div className="min-h-screen pb-10 pt-3 sm:pt-4">
      <div className="section-shell">
        <header className="sticky top-3 z-40 overflow-hidden rounded-[1.9rem] border border-charcoal/10 bg-paper/95 shadow-soft backdrop-blur">
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link
                  href="/admin/inquiries"
                  className="text-[11px] font-semibold uppercase tracking-[0.22em] text-charcoal/58 transition hover:text-charcoal"
                >
                  Sweet Fork Admin
                </Link>
                <p className="mt-1 truncate text-sm text-charcoal/68">
                  <span className="font-medium text-charcoal">
                    {admin.fullName || admin.email}
                  </span>{" "}
                  <span className="text-charcoal/35">•</span>{" "}
                  <span className="capitalize">{admin.role}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-charcoal/12 bg-white/82 px-4 text-sm font-medium text-charcoal transition hover:border-charcoal/30 hover:bg-white"
                >
                  View site
                </Link>
                <form action={signOutAdmin}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="h-10 rounded-full border border-charcoal/12 bg-white/82 px-4 hover:bg-white"
                  >
                    Sign out
                  </Button>
                </form>
              </div>
            </div>

            <div className="border-t border-charcoal/8 pt-3">
              <AdminNav />
            </div>
          </div>
        </header>

        <div className="pt-5">{children}</div>
      </div>
    </div>
  );
}
