"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/env";

export function createClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const env = getSupabaseEnv();

  return createBrowserClient(env.url, env.anonKey);
}
