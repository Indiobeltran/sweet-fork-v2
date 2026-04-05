const requiredServerKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

type SupabaseEnv = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

export function getPublicEnv() {
  return {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    uploadEnabled: process.env.INQUIRY_UPLOAD_ENABLED !== "false",
    linkFallbackEnabled: process.env.INQUIRY_LINK_FALLBACK_ENABLED !== "false",
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || "inspiration",
  };
}

export function isSupabaseConfigured() {
  return requiredServerKeys.every((key) => Boolean(process.env[key]));
}

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
  };
}
