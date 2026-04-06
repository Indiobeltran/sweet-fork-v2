"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";

type AdminLoginFormProps = {
  disabled?: boolean;
};

export function AdminLoginForm({ disabled = false }: AdminLoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const supabase = createClient();
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      if (!supabase) {
        setError("Admin login is not available until Supabase is configured for this workspace.");
        return;
      }

      setError(null);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("We couldn’t sign you in with those details. Please check your email and password.");
        return;
      }

      router.replace("/admin/inquiries");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="email">Admin email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          disabled={disabled || isPending}
          placeholder="owner@sweetforkbakery.com"
          required
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          disabled={disabled || isPending}
          placeholder="Enter your password"
          required
        />
      </div>

      {error ? <p className="text-sm leading-7 text-rose-700">{error}</p> : null}

      <Button
        type="submit"
        className="w-full"
        disabled={disabled || isPending}
        icon={
          isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <LockKeyhole className="h-4 w-4" />
          )
        }
      >
        {isPending ? "Signing in..." : "Open inquiry desk"}
      </Button>
    </form>
  );
}
