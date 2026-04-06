import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { signOutAdmin } from "@/app/admin/actions";

export const metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage() {
  const [admin, supabaseConfigured, supabase] = await Promise.all([
    getCurrentAdmin(),
    Promise.resolve(isSupabaseConfigured()),
    createClient(),
  ]);

  if (admin) {
    redirect("/admin/inquiries");
  }

  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  return (
    <main className="section-shell flex min-h-screen items-center py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="grain-surface overflow-hidden rounded-[2.5rem] border border-charcoal/10 bg-paper px-7 py-8 shadow-soft sm:px-9 sm:py-10">
          <Badge>Sweet Fork Admin</Badge>
          <h1 className="mt-5 font-serif text-5xl leading-none tracking-[-0.05em] text-charcoal sm:text-6xl">
            Review inquiries in one calm, private workspace.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-charcoal/68">
            This admin area is limited to owner and manager accounts. Once signed in, you can
            review new requests, open the full inquiry detail, add internal notes, and update the
            status as conversations move forward.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.75rem] border border-charcoal/8 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                Access
              </p>
              <p className="mt-2 text-sm leading-7 text-charcoal/72">
                Owner or manager role required through Supabase auth.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-charcoal/8 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                Included
              </p>
              <p className="mt-2 text-sm leading-7 text-charcoal/72">
                Inquiry list, detail review, notes, status updates, and inspiration viewing.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-charcoal/8 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                Next phase
              </p>
              <p className="mt-2 text-sm leading-7 text-charcoal/72">
                Order conversion, customers, and payments stay outside this pass.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-charcoal/10 bg-white/88 p-7 shadow-soft sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/45">
            Staff sign-in
          </p>
          <h2 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-charcoal">
            Open the inquiry desk
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-charcoal/66">
            Use your Sweet Fork admin credentials. If you can sign in but still cannot access the
            admin area, your account likely needs an owner or manager role in `user_roles`.
          </p>

          {!supabaseConfigured ? (
            <div className="mt-8 rounded-[1.8rem] border border-rose/20 bg-rose/10 p-5 text-sm leading-7 text-charcoal/78">
              Supabase environment variables are not configured in this workspace yet, so admin
              sign-in is temporarily unavailable.
            </div>
          ) : null}

          {user && !admin ? (
            <div className="mt-8 rounded-[1.8rem] border border-gold/25 bg-gold/10 p-5">
              <p className="text-sm font-medium text-charcoal">
                You are signed in as {user.email ?? "a staff user"}, but this account does not have
                admin access yet.
              </p>
              <p className="mt-2 text-sm leading-7 text-charcoal/68">
                Ask an owner to confirm the matching `profiles` and `user_roles` records, then sign
                in again.
              </p>
              <form action={signOutAdmin} className="mt-5">
                <Button type="submit" variant="secondary">
                  Sign out
                </Button>
              </form>
            </div>
          ) : (
            <div className="mt-8">
              <AdminLoginForm disabled={!supabaseConfigured} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
