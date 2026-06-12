import { createClient } from "@supabase/supabase-js";

import { getPublicSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/supabase.generated";

export function createPublicDataClient() {
  const env = getPublicSupabaseEnv();

  return createClient<Database>(env.url, env.publicKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
