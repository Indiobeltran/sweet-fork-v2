"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseEnv, isSupabaseBrowserConfigured } from "@/lib/env";
import type { Database } from "@/types/supabase.generated";

export function createClient() {
  if (!isSupabaseBrowserConfigured()) {
    return null;
  }

  const env = getPublicSupabaseEnv();

  return createBrowserClient<Database>(env.url, env.anonKey);
}
