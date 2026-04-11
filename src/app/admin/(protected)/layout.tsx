import Image from "next/image";
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
        <header className="sticky top-3 z-40 overflow-hidden rounded-[2rem] border border-charcoal/10 bg-ivory/88 shadow-[0_18px_50px_rgba(53,37,29,0.08),0_2px_10px_rgba(53,37,29,0.04)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <Link
                  href="/admin/inquiries"
                  className="inline-flex shrink-0 items-center rounded-[1.6rem] border border-charcoal/8 bg-white/72 px-4 py-3 transition hover:border-charcoal/14 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold/50"
                >
                  <Image
                    src="/brand/logo-dark.png"
                    alt="The Sweet Fork"
                    width={1024}
                    height={582}
                    sizes="(max-width: 640px) 112px, 132px"
                    className="h-auto w-[112px] sm:w-[132px]"
                    priority
                  />
                </Link>

                <div className="min-w-0">
                  <Link
                    href="/admin/inquiries"
                    className="text-[11px] font-semibold uppercase tracking-[0.22em] text-charcoal/56 transition hover:text-charcoal"
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
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-charcoal/10 bg-white/82 px-4 text-sm font-medium text-charcoal transition hover:border-charcoal/22 hover:bg-white"
                >
                  View site
                </Link>
                <form action={signOutAdmin}>
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    className="h-10 border-charcoal/10 bg-white/82 px-4 hover:border-charcoal/22 hover:bg-white"
                  >
                    Sign out
                  </Button>
                </form>
              </div>
            </div>

            <div className="border-t border-charcoal/8 pt-4">
              <AdminNav />
            </div>
          </div>
        </header>

        <div className="pt-5">{children}</div>
      </div>
    </div>
  );
}
