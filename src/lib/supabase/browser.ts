"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/supabase.generated";

export function createClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const env = getSupabaseEnv();

  return createBrowserClient<Database>(env.url, env.anonKey);
}
